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

export function generateTestHarness(
  problem: ProblemDefinition,
  language: string,
  testCases: TestCase[]
): string {
  switch (language) {
    case "java":
      return generateJavaHarness(problem, testCases);
    case "python":
      return generatePythonHarness(problem, testCases);
    case "javascript":
      return generateJavaScriptHarness(problem, testCases);
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}


function generateJavaHarness(problem: ProblemDefinition, testCases: TestCase[]): string {
  const functionSig = problem.functionSignatures?.java;
  if (!functionSig) throw new Error("No Java function signature defined for this problem");

  const testInputs = testCases.map(tc => tc.input);
  const expectedOutputs = testCases.map(tc => tc.output);

  const inputArrays = generateJavaInputArrays(functionSig, testInputs);
  const outputArray = generateJavaOutputArray(functionSig.returnType ?? "", expectedOutputs);

  return `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        
${inputArrays}
        
${outputArray}
        
        int passed = 0;
        int total = ${testCases.length};
        
        System.out.println("{");
        System.out.println("  \\"results\\": [");
        
        for (int i = 0; i < total; i++) {
            try {
                long startTime = System.nanoTime();
                ${generateJavaFunctionCall(functionSig, testCases.length)}
                long endTime = System.nanoTime();
                
                boolean isPassed = ${generateJavaComparison(functionSig.returnType ?? "")};
                
                if (isPassed) passed++;
                
                System.out.println("    {");
                System.out.println("      \\"testNumber\\": " + i + ",");
                System.out.println("      \\"passed\\": " + isPassed + ",");
                System.out.println("      \\"input\\": \\"" + ${generateJavaInputString(functionSig)} + "\\",");
                System.out.println("      \\"actual\\": \\"" + ${generateJavaToString(
                  functionSig.returnType ?? "",
                  "result"
                )} + "\\",");
                System.out.println("      \\"expected\\": \\"" + ${generateJavaToString(
                  functionSig.returnType ?? "",
                  "expected[i]"
                )} + "\\",");
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
    }
}`;
}

function generateJavaInputArrays(functionSig: FunctionSignature, testInputs: Record<string, any>[]): string {
  const params = functionSig.parameters;
  const arrays: string[] = [];

  params.forEach(param => {
    const { name: paramName, type: paramType } = param;
    const values = testInputs.map(input => input[paramName]);

    if (paramType === "int[]") {
      const arrayLiteral = values
        .map(val => `{${Array.isArray(val) ? val.join(", ") : val}}`)
        .join(",\n            ");
      arrays.push(`        int[][] ${paramName}Inputs = {\n            ${arrayLiteral}\n        };`);
    } else if (paramType === "int") {
      arrays.push(`        int[] ${paramName}Inputs = {${values.join(", ")}};`);
    } else if (paramType === "String") {
      const arrayLiteral = values.map(val => `"${val}"`).join(", ");
      arrays.push(`        String[] ${paramName}Inputs = {${arrayLiteral}};`);
    }
  });

  return arrays.join("\n");
}

function generateJavaOutputArray(returnType: string, expectedOutputs: any[]): string {
  if (returnType === "int[]") {
    const arrayLiteral = expectedOutputs
      .map(output => `{${Array.isArray(output) ? output.join(", ") : output}}`)
      .join(",\n            ");
    return `        int[][] expected = {\n            ${arrayLiteral}\n        };`;
  } else if (returnType === "int") {
    return `        int[] expected = {${expectedOutputs.join(", ")}};`;
  } else if (returnType === "String") {
    const arrayLiteral = expectedOutputs.map(o => `"${o}"`).join(", ");
    return `        String[] expected = {${arrayLiteral}};`;
  }
  return `        Object[] expected = {}; // TODO: Handle ${returnType}`;
}

function generateJavaFunctionCall(functionSig: FunctionSignature, _numTests: number): string {
  const args = functionSig.parameters.map(p => `${p.name}Inputs[i]`).join(", ");
  return `${functionSig.returnType ?? "var"} result = solution.${functionSig.name}(${args});`;
}

function generateJavaComparison(returnType: string): string {
  switch (returnType) {
    case "int[]":
      return "Arrays.equals(result, expected[i])";
    case "int":
      return "result == expected[i]";
    case "String":
      return "result.equals(expected[i])";
    default:
      return "false";
  }
}

function generateJavaToString(returnType: string, varName: string): string {
  return returnType === "int[]" ? `Arrays.toString(${varName})` : varName;
}

function generateJavaInputString(functionSig: FunctionSignature): string {
  const params = functionSig.parameters.map(p => {
    if (p.type === "int[]") {
      return `Arrays.toString(${p.name}Inputs[i])`;
    }
    return `${p.name}Inputs[i]`;
  });
  return params.join(' + ", " + ');
}

/* ---------------------------- PYTHON HARNESS ---------------------------- */

function generatePythonHarness(problem: ProblemDefinition, testCases: TestCase[]): string {
  const functionSig = problem.functionSignatures?.python;
  if (!functionSig) throw new Error("No Python function signature defined for this problem");

  const functionName = functionSig.name;
  const params = functionSig.parameters;
  const testInputsCode = generatePythonTestInputs(params, testCases);
  const expectedOutputsCode = generatePythonExpectedOutputs(testCases);

  return `import json
import time
from typing import List, Optional

test_cases = ${testInputsCode}
expected_outputs = ${expectedOutputsCode}

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

function generatePythonTestInputs(params: FunctionParameter[], testCases: TestCase[]): string {
  const pythonTestCases = testCases.map(tc => {
    const inputDict: Record<string, any> = {};
    params.forEach(param => {
      inputDict[param.name] = tc.input[param.name];
    });
    return inputDict;
  });
  return JSON.stringify(pythonTestCases, null, 2);
}

function generatePythonExpectedOutputs(testCases: TestCase[]): string {
  return JSON.stringify(testCases.map(tc => tc.output), null, 2);
}


function generateJavaScriptHarness(_problem: ProblemDefinition, testCases: TestCase[]): string {
  return `// JavaScript harness generation not yet implemented
// Test cases: ${testCases.length}
console.log("JavaScript execution not yet implemented");`;
}
