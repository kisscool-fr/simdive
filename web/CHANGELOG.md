# Changelog

## [1.1.0](https://github.com/kisscool-fr/simdive/compare/v1.0.0...v1.1.0) (2026-11-24)


### Features

* **air:** improve gauge air percentage bar ([#1](https://github.com/kisscool-fr/simdive/issues/1)) ([83c9070](https://github.com/kisscool-fr/simdive/commit/83c90709ac66a36a76433000947e7d06dc62a67b))
* **air:** use better color scheme ([2073028](https://github.com/kisscool-fr/simdive/commit/2073028daff04e53b759f2e74511179433821db5))
* **graph:** add a dive graphical visualisation ([911afd5](https://github.com/kisscool-fr/simdive/commit/911afd59ec2c6be85606b1b566f9f631626e7109))
* **graph:** add a dive graphical visualisation ([#4](https://github.com/kisscool-fr/simdive/issues/4)) ([d3430cb](https://github.com/kisscool-fr/simdive/commit/d3430cbbfa922b8b504ebe4d5dc719899ae5b54b))
* **graph:** fix dot issue, use chart.js ([bf65fe4](https://github.com/kisscool-fr/simdive/commit/bf65fe4c75d38a2872be853634df4becea28c109))
* **graph:** fix format ([082949d](https://github.com/kisscool-fr/simdive/commit/082949d1cccb22b05f175cc99172a485c5af0c39))
* **graph:** lint & format ([50c5636](https://github.com/kisscool-fr/simdive/commit/50c5636efa81659fcc94b173aeca4538a401f299))
* **graph:** make div closable ([825f5ba](https://github.com/kisscool-fr/simdive/commit/825f5ba30a67dc35db211d4ddabee966dcadf148))
* **ui:** display application version in footer ([6cd932c](https://github.com/kisscool-fr/simdive/commit/6cd932cab064c1c810b49bffd097223dbecf9656))


### Bug Fixes

* **air:** use initialTankPressure instead of fixed value to compute air ([fd06ed2](https://github.com/kisscool-fr/simdive/commit/fd06ed25eb5a8265d7bfb96f8009a3dd82b9e4e4))
* **brace-expansion:** fix security issue ([a36631d](https://github.com/kisscool-fr/simdive/commit/a36631d3555be1fcc883263a1dca9fb8f3b2fd38))
* **brace-expansion:** fix security issue ([#90](https://github.com/kisscool-fr/simdive/issues/90)) ([344465a](https://github.com/kisscool-fr/simdive/commit/344465a201f99bc717f3cfacc13a1ed07a552b9c))
* **deco:** compute ceiling with GF interpolation consistent with NDL ([a865086](https://github.com/kisscool-fr/simdive/commit/a8650865e303f9eb87be692066f822cf171d0172))
* **deco:** compute ceiling with GF interpolation consistent with NDL ([#113](https://github.com/kisscool-fr/simdive/issues/113)) ([c6c9995](https://github.com/kisscool-fr/simdive/commit/c6c99958301de02adb57bfa1b6c9eefa2cb9e7c4))
* **dependencies:** fix typescript ([#103](https://github.com/kisscool-fr/simdive/issues/103)) ([3971dc8](https://github.com/kisscool-fr/simdive/commit/3971dc8aa70464801497cb595a6cb2755d829939))
* **deps:** resync package-lock.json typescript resolution with package.json range ([95eeda9](https://github.com/kisscool-fr/simdive/commit/95eeda9cec9ad4251a733daf380a6d9b6084b653))
* **divechart:** update is now smooth ([a242fd3](https://github.com/kisscool-fr/simdive/commit/a242fd31a443de102b07237d3afbebc634f31794))
* **divechart:** update is now smooth ([#13](https://github.com/kisscool-fr/simdive/issues/13)) ([773bf22](https://github.com/kisscool-fr/simdive/commit/773bf224f097856bc72697c7721d12abd0da1df2))
* **linter:** fix some linter issues ([5a2a9b5](https://github.com/kisscool-fr/simdive/commit/5a2a9b5b3c5731ac27d3b75501b696b622358b47))
* **linter:** fix some linter issues ([#10](https://github.com/kisscool-fr/simdive/issues/10)) ([693b08c](https://github.com/kisscool-fr/simdive/commit/693b08cd2539651b5e2b3651e3b9ab778f273540))
* **safety-stop:** fix timer ([2aadccd](https://github.com/kisscool-fr/simdive/commit/2aadccd6016a739d21acf1bc873c8d7bb5e8cf7a))
* **safety-stop:** fix timer ([#7](https://github.com/kisscool-fr/simdive/issues/7)) ([9386bcf](https://github.com/kisscool-fr/simdive/commit/9386bcfd6a6c22cd47dd579cd9a904e9e5a5bdee))
* **saturation:** fix saturation graph reset ([5ff8e41](https://github.com/kisscool-fr/simdive/commit/5ff8e4103fb6fa8e823fd2c964e0b882a370bcef))
* **saturation:** fix saturation graph reset ([#12](https://github.com/kisscool-fr/simdive/issues/12)) ([38e43ef](https://github.com/kisscool-fr/simdive/commit/38e43ef3e6d59ee97877474906405c2e845c18ac))
* **security:** fix babel-core ([a14da13](https://github.com/kisscool-fr/simdive/commit/a14da13779801ad97d586c20997d558788223736))
* **security:** fix babel-core ([#86](https://github.com/kisscool-fr/simdive/issues/86)) ([d494fef](https://github.com/kisscool-fr/simdive/commit/d494fefba02082b8f3fd218f3fdfaf641ce97e52))
* **speed:** fix ascent speed ([665553d](https://github.com/kisscool-fr/simdive/commit/665553dd1e872449afcaa8e5d129518d9f2807c2))
* **speed:** fix ascent speed ([#6](https://github.com/kisscool-fr/simdive/issues/6)) ([0d71e2f](https://github.com/kisscool-fr/simdive/commit/0d71e2fb70fe7ff2eee253eb9ebf97dd4cd29c71))
* **test:** exclude tests files to fix build ([b43ba8e](https://github.com/kisscool-fr/simdive/commit/b43ba8e67b55e4ea4ef9956acf8994a33be2fff3))
* **warning:** fix ascent rate message display that where glitching ([54980a8](https://github.com/kisscool-fr/simdive/commit/54980a8287c2ea30a793c590b78d6168c1713db4))
* **warning:** fix ascent rate message display that where glitching ([#9](https://github.com/kisscool-fr/simdive/issues/9)) ([76744d3](https://github.com/kisscool-fr/simdive/commit/76744d3b3ef778404e5c2b02a38e7a2a5c353789))
* **warning:** use absolut value instead of percentage ([3183b50](https://github.com/kisscool-fr/simdive/commit/3183b50117e787227cb5f0d988dc69cb3dc21ca5))
* **warning:** use absolut value instead of percentage ([#8](https://github.com/kisscool-fr/simdive/issues/8)) ([2ab5f03](https://github.com/kisscool-fr/simdive/commit/2ab5f034ceeb11b88ef4eba5df08f34893207dc3))
