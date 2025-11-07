/**
 * Dynamically generates test harness code based on problem definition and test cases
 */

function generateTestHarness(problem, language, testCases) {
  if (language === 'java') {
    return generateJavaHarness(problem, testCases);
  } else if (language === 'python') {
    return generatePythonHarness(problem, testCases);
  } else if (language === 'javascript') {
    return generateJavaScriptHarness(problem, testCases);
  }
  throw new Error(`Unsupported language: ${language}`);
}

function generateJavaHarness(problem, testCases) {
  const functionSig = problem.functionSignatures?.java;
  if (!functionSig) {
    throw new Error('No Java function signature defined for this problem');
  }

  // Convert test cases to Java format
  const testInputs = testCases.map(tc => tc.input);
  const expectedOutputs = testCases.map(tc => tc.output);

  // Generate test input arrays based on function parameters
  const inputArrays = generateJavaInputArrays(functionSig, testInputs);
  const outputArray = generateJavaOutputArray(functionSig.returnType, expectedOutputs);

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
                
                boolean isPassed = ${generateJavaComparison(functionSig.returnType)};
                
                if (isPassed) passed++;
                
                System.out.println("    {");
                System.out.println("      \\"testNumber\\": " + i + ",");
                System.out.println("      \\"passed\\": " + isPassed + ",");
                System.out.println("      \\"actual\\": \\"" + ${generateJavaToString(functionSig.returnType, 'result')} + "\\",");
                System.out.println("      \\"expected\\": \\"" + ${generateJavaToString(functionSig.returnType, 'expected[i]')} + "\\",");
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

function generateJavaInputArrays(functionSig, testInputs) {
  const params = functionSig.parameters;
  const arrays = [];

  params.forEach(param => {
    const paramName = param.name;
    const paramType = param.type;
    
    // Extract values for this parameter from all test cases
    const values = testInputs.map(input => input[paramName]);
    
    if (paramType === 'int[]') {
      const arrayLiteral = values.map(val => 
        `{${Array.isArray(val) ? val.join(', ') : val}}`
      ).join(',\n            ');
      arrays.push(`        int[][] ${paramName}Inputs = {\n            ${arrayLiteral}\n        };`);
    } else if (paramType === 'int') {
      const arrayLiteral = values.join(', ');
      arrays.push(`        int[] ${paramName}Inputs = {${arrayLiteral}};`);
    } else if (paramType === 'String') {
      const arrayLiteral = values.map(val => `"${val}"`).join(', ');
      arrays.push(`        String[] ${paramName}Inputs = {${arrayLiteral}};`);
    }
    // Add more type handlers as needed
  });

  return arrays.join('\n');
}

function generateJavaOutputArray(returnType, expectedOutputs) {
  if (returnType === 'int[]') {
    const arrayLiteral = expectedOutputs.map(output => 
      `{${Array.isArray(output) ? output.join(', ') : output}}`
    ).join(',\n            ');
    return `        int[][] expected = {\n            ${arrayLiteral}\n        };`;
  } else if (returnType === 'int') {
    const arrayLiteral = expectedOutputs.join(', ');
    return `        int[] expected = {${arrayLiteral}};`;
  } else if (returnType === 'String') {
    const arrayLiteral = expectedOutputs.map(output => `"${output}"`).join(', ');
    return `        String[] expected = {${arrayLiteral}};`;
  }
  return `        Object[] expected = {}; // TODO: Handle ${returnType}`;
}

function generateJavaFunctionCall(functionSig, numTests) {
  const params = functionSig.parameters;
  const args = params.map(p => `${p.name}Inputs[i]`).join(', ');
  return `${functionSig.returnType} result = solution.${functionSig.name}(${args});`;
}

function generateJavaComparison(returnType) {
  if (returnType === 'int[]') {
    return 'Arrays.equals(result, expected[i])';
  } else if (returnType === 'int') {
    return 'result == expected[i]';
  } else if (returnType === 'String') {
    return 'result.equals(expected[i])';
  }
  return 'false';
}

function generateJavaToString(returnType, varName) {
  if (returnType === 'int[]') {
    return `Arrays.toString(${varName})`;
  }
  return varName;
}

function generatePythonHarness(problem, testCases) {
  const functionSig = problem.functionSignatures?.python;
  if (!functionSig) {
    throw new Error('No Python function signature defined for this problem');
  }

  const functionName = functionSig.name;
  const params = functionSig.parameters;

  // Generate test inputs and expected outputs as Python lists
  const testInputsCode = generatePythonTestInputs(params, testCases);
  const expectedOutputsCode = generatePythonExpectedOutputs(testCases);

  return `import json
import time
from typing import List, Optional

# Test data
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
                "actual": str(result),
                "expected": str(expected),
                "executionTime": (end_time - start_time) * 1000  # Convert to ms
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

function generatePythonTestInputs(params, testCases) {
  // Convert test cases to Python list of dicts
  const pythonTestCases = testCases.map(tc => {
    const inputDict = {};
    params.forEach(param => {
      inputDict[param.name] = tc.input[param.name];
    });
    return inputDict;
  });
  
  return JSON.stringify(pythonTestCases, null, 2);
}

function generatePythonExpectedOutputs(testCases) {
  const outputs = testCases.map(tc => tc.output);
  return JSON.stringify(outputs, null, 2);
}

function generateJavaScriptHarness(problem, testCases) {
  // TODO: Implement JavaScript harness generation
  return `// JavaScript harness generation not yet implemented
// Test cases: ${testCases.length}
console.log("JavaScript execution not yet implemented");`;
}

module.exports = {
  generateTestHarness
};

