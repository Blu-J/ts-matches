module.exports = function(wallaby) {
  return {
    files: ["./src/**/*.ts"],
    tests: ["./tests/**/*.spec.ts"],
    transform: {
      "^.+\\.tsx?$": "ts-jest"
    },
    env: {
      type: "node",
      runner: "node"
    },
    testFramework: "jest"
  };
};
