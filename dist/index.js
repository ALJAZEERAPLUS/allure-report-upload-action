/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 54:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 767:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 266:
/***/ ((module) => {

module.exports = eval("require")("node-fetch");


/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(54)
const github = __nccwpck_require__(767)
const fetch = __nccwpck_require__(266)
const fs = __nccwpck_require__(147)

async function run() {
  try {
    const allureResultsDir = core.getInput('allure-results-dir')
    const allureServerUrl = core.getInput('allure-server-url')
    const allureProjectId = core.getInput('allure-project-id')
    const runId = core.getInput('run_id')
    const {owner, repo} = github.context.repo
    const executionName = github.context.actor
    const executionFrom = `https://github.com/${owner}/${repo}/actions/runs/${runId}`
    const executionType = 'github'

    resultsFiles = []

    fs.readdir(allureResultsDir, async function (err, files) {
      if (err) {
        core.setFailed(err.message)
      } else if (!files.length) {
        core.setFailed('No files found in ' + allureResultsDir)
      } else {
        files.forEach(function (file) {
          let result = {}
          result['file_name'] = file
          result['content_base64'] = fs.readFileSync(allureResultsDir + file).toString('base64')
          resultsFiles.push(result)
        })

        const postSendResultResponse = await fetch(
          `${allureServerUrl}/send-results?project_id=${allureProjectId}&force_project_creation=true`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              results: resultsFiles,
            }),
          },
        )
          .then((response) => response.json())
          .catch((error) => {
            core.setFailed(error.message)
          })

        core.debug(`Allure upload response: ${JSON.stringify(postSendResultResponse)}`)
      }
    })

    // There is a delay between project creating and the report generation, that's why the timeout is needed
    await new Promise((resolve) => setTimeout(resolve, 2000))

    core.info('Allure upload finished. Generating report...')

    const getGenerateReportResponse = await fetch(
      `${allureServerUrl}/generate-report?project_id=${allureProjectId}&execution_name=${executionName}&execution_from=${executionFrom}&execution_type=${executionType}`,
      {
        method: 'GET',
      },
    )
      .then((response) => response.json())
      .catch((error) => {
        core.setFailed(error.message)
      })

    core.info('Allure report generated.')

    core.setOutput('allure-report-url', getGenerateReportResponse.data.report_url)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()

})();

module.exports = __webpack_exports__;
/******/ })()
;