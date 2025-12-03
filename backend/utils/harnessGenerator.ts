export interface FunctionParameter {
  name: string;
  type: string;
}

export interface FunctionSignature {
  name: string;
  parameters: FunctionParameter[];
  returnType?: string;
}

export interface ProblemDefinition {
  functionSignatures?: {
    java?: FunctionSignature;
    python?: FunctionSignature;
    javascript?: FunctionSignature;
  };
}

export interface TestCase {
  input: Record<string, any>;
  output: any;
}

// Generate a generic test harness that accepts test case data via stdin
export function generateTestHarness(
  problem: ProblemDefinition,
  language: string
): string {
  switch (language) {
    case "java":
      return generateJavaHarness(problem);
    case "python":
      return generatePythonHarness(problem);
    case "javascript":
      return generateJavaScriptHarness(problem);
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}


function generateJavaHarness(problem: ProblemDefinition): string {
  const functionSig = problem.functionSignatures?.java;
  if (!functionSig) throw new Error("No Java function signature defined for this problem");

  return `import java.util.*;
import java.nio.file.*;
import com.google.gson.*;

public class Main {
    public static void main(String[] args) {
        try {
            Solution solution = new Solution();
            
            // Read test cases from JSON file
            String content = new String(Files.readAllBytes(Paths.get("test_cases.json")));
            JsonObject data = JsonParser.parseString(content).getAsJsonObject();
            JsonArray inputs = data.getAsJsonArray("inputs");
            JsonArray outputs = data.getAsJsonArray("outputs");
            
            int passed = 0;
            int total = inputs.size();
            
            System.out.println("{");
            System.out.println("  \\"results\\": [");
            
            for (int i = 0; i < total; i++) {
                try {
                    JsonObject testInput = inputs.get(i).getAsJsonObject();
                    JsonElement expectedOutput = outputs.get(i);
                    
                    long startTime = System.nanoTime();
                    ${generateJavaFunctionCallFromJson(functionSig)}
                    long endTime = System.nanoTime();
                    
                    boolean isPassed = ${generateJavaComparisonFromJson(functionSig.returnType ?? "")};
                    
                    if (isPassed) passed++;
                    
                    System.out.println("    {");
                    System.out.println("      \\"testNumber\\": " + i + ",");
                    System.out.println("      \\"passed\\": " + isPassed + ",");
                    System.out.println("      \\"input\\": \\"" + testInput + "\\",");
                    System.out.println("      \\"actual\\": \\"" + result + "\\",");
                    System.out.println("      \\"expected\\": \\"" + expectedOutput + "\\",");
                    System.out.println("      \\"executionTime\\": " + ((endTime - startTime) / 1000000.0));
                    System.out.print("    }");
                    if (i < total - 1) System.out.println(",");
                    else System.out.println();
                    
                } catch (Exception e) {
                    System.out.println("    {");
                    System.out.println("      \\"testNumber\\": " + i + ",");
                    System.out.println("      \\"passed\\": false,");
                    System.out.println("      \\"error\\": \\"" + e.getMessage() + "\\"");
                    System.out.print("    }");
                    if (i < total - 1) System.out.println(",");
                    else System.out.println();
                }
            }
            
            System.out.println("  ],");
            System.out.println("  \\"passedTests\\": " + passed + ",");
            System.out.println("  \\"totalTests\\": " + total + ",");
            System.out.println("  \\"status\\": \\"" + (passed == total ? "Accepted" : "Wrong Answer") + "\\"");
            System.out.println("}");
            
        } catch (Exception e) {
            System.err.println("Failed to read test cases: " + e.getMessage());
        }
    }
    
    // Helper methods for JSON parsing
    ${generateJavaJsonHelpers(functionSig)}
}`;
}

function generateJavaFunctionCallFromJson(functionSig: FunctionSignature): string {
  const params = functionSig.parameters.map(p => `parse${capitalize(p.type)}(testInput, "${p.name}")`).join(", ");
  return `${functionSig.returnType ?? "var"} result = solution.${functionSig.name}(${params});`;
}

function generateJavaComparisonFromJson(returnType: string): string {
  switch (returnType) {
    case "int[]":
      return "Arrays.equals(result, parseIntArray(expectedOutput))";
    case "int":
      return "result == expectedOutput.getAsInt()";
    case "String":
      return "result.equals(expectedOutput.getAsString())";
    default:
      return "false";
  }
}

function generateJavaJsonHelpers(functionSig: FunctionSignature): string {
  const helpers: string[] = [];
  const types = new Set(functionSig.parameters.map(p => p.type));
  
  if (types.has("int")) {
    helpers.push(`
    private static int parseInt(JsonObject obj, String key) {
        return obj.get(key).getAsInt();
    }`);
  }
  
  if (types.has("int[]")) {
    helpers.push(`
    private static int[] parseIntArray(JsonObject obj, String key) {
        JsonArray arr = obj.getAsJsonArray(key);
        int[] result = new int[arr.size()];
        for (int i = 0; i < arr.size(); i++) {
            result[i] = arr.get(i).getAsInt();
        }
        return result;
    }
    
    private static int[] parseIntArray(JsonElement elem) {
        JsonArray arr = elem.getAsJsonArray();
        int[] result = new int[arr.size()];
        for (int i = 0; i < arr.size(); i++) {
            result[i] = arr.get(i).getAsInt();
        }
        return result;
    }`);
  }
  
  if (types.has("String")) {
    helpers.push(`
    private static String parseString(JsonObject obj, String key) {
        return obj.get(key).getAsString();
    }`);
  }
  
  return helpers.join("\n");
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


/* ---------------------------- PYTHON HARNESS ---------------------------- */

function generatePythonHarness(problem: ProblemDefinition): string {
  const functionSig = problem.functionSignatures?.python;
  if (!functionSig) throw new Error("No Python function signature defined for this problem");

  const functionName = functionSig.name;

  return `import json
import time
from typing import List, Optional

# Read test cases from file
with open('test_cases.json', 'r') as f:
    data = json.load(f)
    test_cases = data['inputs']
    expected_outputs = data['outputs']

def run_tests():
    results = []
    passed = 0
    total = len(test_cases)
    
    for i, test_input in enumerate(test_cases):
        try:
            start_time = time.perf_counter()
            result = ${functionName}(**test_input)
            end_time = time.perf_counter()
            
            expected = expected_outputs[i]
            is_passed = result == expected
            
            if is_passed:
                passed += 1
            
            results.append({
                "testNumber": i,
                "passed": is_passed,
                "input": str(test_input),
                "actual": str(result),
                "expected": str(expected),
                "executionTime": (end_time - start_time) * 1000
            })
        except Exception as e:
            results.append({
                "testNumber": i,
                "passed": False,
                "error": str(e)
            })
    
    output = {
        "results": results,
        "passedTests": passed,
        "totalTests": total,
        "status": "Accepted" if passed == total else "Wrong Answer"
    }
    
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    run_tests()
`;
}


function generateJavaScriptHarness(problem: ProblemDefinition): string {
  const functionSig = problem.functionSignatures?.javascript;
  if (!functionSig) throw new Error("No JavaScript function signature defined for this problem");

  const functionName = functionSig.name;

  return `const fs = require('fs');

// Read test cases from file
const data = JSON.parse(fs.readFileSync('test_cases.json', 'utf8'));
const testCases = data.inputs;
const expectedOutputs = data.outputs;

function runTests() {
    const results = [];
    let passed = 0;
    const total = testCases.length;
    
    for (let i = 0; i < total; i++) {
        try {
            const startTime = performance.now();
            const result = ${functionName}(...Object.values(testCases[i]));
            const endTime = performance.now();
            
            const expected = expectedOutputs[i];
            const isPassed = JSON.stringify(result) === JSON.stringify(expected);
            
            if (isPassed) passed++;
            
            results.push({
                testNumber: i,
                passed: isPassed,
                input: JSON.stringify(testCases[i]),
                actual: JSON.stringify(result),
                expected: JSON.stringify(expected),
                executionTime: endTime - startTime
            });
        } catch (e) {
            results.push({
                testNumber: i,
                passed: false,
                error: e.message
            });
        }
    }
    
    const output = {
        results,
        passedTests: passed,
        totalTests: total,
        status: passed === total ? "Accepted" : "Wrong Answer"
    };
    
    console.log(JSON.stringify(output, null, 2));
}

runTests();
`;
}
