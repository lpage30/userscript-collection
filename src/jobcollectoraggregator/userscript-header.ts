// ==UserScript==
// @name        Job-Collector-Aggregator
// @version     0.1
// @description tool supporting collection of Jobs from job sites, and aggregation for JobApplication app
// @author      lawrence L. Page
// @include     http://localhost:3000/job-collector-aggregator-dashboard.html
// @namespace   lpage30-userscripts
// @run-at      document-start

// @include     https://www.linkedin.com/jobs/view*
// @include     https://www.indeed.com/viewjob*
// @include     https://www.indeed.com/jobs?*
// @include     https://www.usajobs.gov/job*
// @include     https://www.builtinboston.com/job*
// @include     *greenhouse.io*
// @include     *trueup.io*
// @include     *dice.com*
// @include     *jobs.lever.co*
// @include     *jobs.ashbyhq.com*
// @include     https://app.welcometothejungle.com*

// @grant       window.onurlchange
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_addValueChangeListener
// @grant       GM_xmlhttpRequest
// @grant       GM_setClipboard
// @grant       unsafeWindow
// ==/UserScript==
