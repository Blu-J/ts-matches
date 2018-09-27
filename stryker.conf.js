module.exports = function(config) {
  config.set({
    mutator: "typescript",
    packageManager: "yarn",
    reporters: ["clear-text", "progress", "html"],
    testRunner: "jest",
    coverageAnalysis: "off",
    mutate: ["src/**/*.ts?(x)", "!src/**/*@(.test|.spec|Spec|.gen).ts?(x)"],
    tsconfigFile: "tsconfig.json",
    timeoutFactor: 5
  });
};
