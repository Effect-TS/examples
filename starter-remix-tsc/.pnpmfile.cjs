function readPackage(pkg, context) {
  if (pkg.dependencies["typescript"]) {
    delete pkg.dependencies["typescript"]
  }
  
  if (pkg.peerDependencies["typescript"]) {
    delete pkg.peerDependencies["typescript"]
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
