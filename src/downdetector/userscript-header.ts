// ==UserScript==
// @name        DownDetector-Dashboard-Status
// @version     0.1
// @description render downdetector info as up-front panels
// @author      lawrence L. Page

// @namespace   lpage30-userscripts
// @run-at      document-start

// @include     https://downdetector.com/
// @include     https://downdetector.com/status/*
// @include     https://health.aws.com/health/status
// @include     https://azure.status.microsoft/en-us/status
// @include     https://status.cloud.google.com/index.html
// @include     https://status.cloud.google.com/regional/americas
// @include     https://status.cloud.google.com/regional/europe
// @include     https://status.cloud.google.com/regional/asia
// @include     https://status.cloud.google.com/regional/middle-east
// @include     https://status.cloud.google.com/regional/africa
// @include     https://status.cloud.google.com/regional/multiregions
// @include     https://ocistatus.oraclecloud.com/
// @include     https://cloud.ibm.com/status
// @include     https://status.digitalocean.com/
// @include     https://www.fastlystatus.com/

// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_xmlhttpRequest
// @grant       window.onurlchange
// @grant       GM_addValueChangeListener
// @grant       GM_removeValueChangeListener
// @grant       GM_openInTab

// @connect     cloudflarestatus.com
// @connect     akamaistatus.com
// ==/UserScript==
