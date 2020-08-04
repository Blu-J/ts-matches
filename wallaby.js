module.exports = function (wallaby) {
  return {
    files: ["./src/**/*.ts", "!./src/**/*.spec.ts"],

    tests: ["./src/**/*.spec.ts"],
    transform: {
      "^.+\\.tsx?$": "ts-jest",
    },
    env: {
      type: "node",
      runner: "node",
    },
    testFramework: "jest",
  };
};
