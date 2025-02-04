import { getPackagesSync } from '@manypkg/get-packages'
import { writeFileSync } from 'fs'
import { join } from 'path'

let { packages } = getPackagesSync(process.cwd())

// map of package names to their versions and directories
const packageVersions = packages.reduce((acc, pkg) => {
    acc[pkg.packageJson.name] = {
        version: pkg.packageJson.version,
        dir: pkg.dir,
    }
    return acc
}, {})

packages.forEach((pag) => console.log(pag.packageJson.name))

// loop over each package and update its dependencies if they are set to * and in the map
packages.forEach((pkg) => {
    const packageJson = pkg.packageJson
    const dependencies = packageJson.dependencies || {}
    const devDependencies = packageJson.devDependencies || {}
    const peerDependencies = packageJson.peerDependencies || {}

    Object.entries(dependencies).forEach(([dep, version]) => {
        if (dep in packageVersions && version === '*') {
            // if it's part of the dependencies directly then ask for the exact version
            packageJson.dependencies[dep] = `${packageVersions[dep].version}`
        }
    })

    Object.entries(devDependencies).forEach(([dep, version]) => {
        if (dep in packageVersions && version === '*') {
            // if it's part of the devDependencies directly then ask for a version within range
            packageJson.devDependencies[
                dep
            ] = `^${packageVersions[dep].version}`
        }
    })

    Object.entries(peerDependencies).forEach(([dep, version]) => {
        if (dep in packageVersions && version === '*') {
            // if it's part of the devDependencies directly then ask for a version within range
            packageJson.peerDependencies[
                dep
            ] = `^${packageVersions[dep].version}`
        }
    })

    // if (!process.env.CI) {
    //     console.error(
    //         `Not in CI, skipping writing package.json for: "${pkg.packageJson.name}"`
    //     )
    //     return
    // }
    console.info('writing package.json for: ', pkg.packageJson.name)
    writeFileSync(
        join(pkg.dir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    )
})
