const core = require('@actions/core')
const github = require('@actions/github')
const fetch = require('node-fetch')
const fs = require('fs')

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

    fs.readdir(allureResultsDir, { withFileTypes: true }, async function (err, artifacts) {
      if (err) {
        core.setFailed(err.message)
      } else if (!artifacts.length) {
        core.setFailed('No files found in ' + allureResultsDir)
      } else {
        const files = artifacts
          .filter(artifact => artifact.isFile())
          .map(artifact => artifact.name);

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
