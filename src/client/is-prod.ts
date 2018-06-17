import queryString from 'query-string'

export function isProd() {
	return window.location.host === 'shamu.adenflorian.com' || prodQueryParamExists()
}

function prodQueryParamExists() {
	return queryString.parse(window.location.search).prod === null
}