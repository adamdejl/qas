"use strict"

jQuery(function($) {

    $(".collapsible").collapsible();

    $("#querySubmit").click(function() {
        processQuery($("#queryInput").val());
    });

    $(document).keydown(function(key) {
        if (key.which == 13) {
            processQuery($("#queryInput").val());
        }
    });

    function showResults() {
        $("#resultArea").show();
    }

    function hideResults() {
        $("#resultArea").hide();
    }

    function showLoadingSpinner() {
        $("#loadingSpinner").css("display", "flex");
    }

    function hideLoadingSpinner() {
        $("#loadingSpinner").css("display", "none");
    }

    function showError(content) {
        hideError();
        const error = $("<i class='material-icons'>error</i>");
        $("#errorView").append(error).append(content).show();
    }

    function hideError() {
        $("#errorView").empty().hide();
    }

    async function processQuery(query) {
        /* Parse the query using pre-defined database of patterns data
         * Store data about query in queryData
         * Store list of required inputs in queryInputs
         * Update matched to true in case of match
         */
        hideError();
        hideResults();
        showLoadingSpinner();

        var queryData;
        var queryInputs = [];
        var matched = false;
        for (var i in data) {
            if (matched) {
                break;
            }
            for (var j in data[i].patterns) {
                var reExp = data[i].patterns[j];
                if (reExp.test(query)) {
                    queryData = data[i];
                    queryInputs = reExp.exec(query).slice(1);
                    matched = true;
                    break;
                }
            }
        }

        if (!queryData) {
            const error = $("<p>Couldn't understand the query. Try something else.</p>");
            showError(error);
            hideLoadingSpinner();
            return;
        }

        /* Clear resultArea */
        $("#resultArea").text("");
        $("#resultArea").css("color", "black");
        /* Process the given type of query */
        switch (queryData.type) {
            case "who":
                var results = await getResultFromWd(queryData.query, queryData.inputs, queryInputs);
                await showWdAndWpResults(results);
                break;
            case "what":
                var results = await getResultFromWd(queryData.query, queryData.inputs, queryInputs);
                await showWdAndWpResults(results);
                break;
        }
        hideLoadingSpinner();
        showResults();
    }

    /*
     * Fetches results from Wikidata based on the specified query, list of namess of input values
       and list of corresponding values
     */
    function getResultFromWd(sparqlQuery, inputs, values) {
        return new Promise(async function(resolve, reject) {
            var originalSparqlQuery = sparqlQuery;
            for (var input in inputs) {
                console.log(inputs[input]);
                console.log(values[input]);
                sparqlQuery = sparqlQuery.replace(inputs[input], values[input]);
            }
            console.log(sparqlQuery);
            try {
                var response = await getWDResponse(sparqlQuery);
            } catch (error) {
                showApiConnectionError();
                return;
            }
            console.log(response);
            /* API request succeeded */
            var results = response.results.bindings;
            if (results.length == 0) {
                /* No match found - spellcheck */
                sparqlQuery = originalSparqlQuery;
                try {
                    for (var input in inputs) {
                        var spellchecked = await spellCheck(values[input]);
                        if (spellchecked == null) {
                            /* No element found */
                            var error = $("<p></p>").text("Oops, nothing here. Try another query.");
                            hideLoadingSpinner();
                            showError(error);
                            return;
                        }
                        sparqlQuery = sparqlQuery.replace(inputs[input], spellchecked);
                    }
                } catch (error) {
                    showApiConnectionError();
                    return;
                }
                /* Match found during spellcheck - try to start again with new subject */
                try {
                    var response = await getWDResponse(sparqlQuery);
                } catch (error) {
                    showApiConnectionError();
                    return;
                }
                /* API request succeeded (again) */
                var results = response.results.bindings;
                if (results.length == 0) {
                    /* No match found even with spellcheck */
                    var error = $("<p></p>").text("Oops, nothing here. Try another query.");
                    hideLoadingSpinner();
                    showError(error);
                    return;
                }
            }
            resolve(results);
        });
    }

    /*
     * Shows results fetched from Wikidata and Wikipedia
     * Used for queries of type "who and "what"
     * Excepts parameter result corresponding to results.bindings in json returned from WD
     */
    function showWdAndWpResults (results) {
        return new Promise(async function(resolve, reject) {
            var resultElem = $("<li></li>");
            var articleNames = [];
            /* Fetch text extracts from Wikipedia (where applicable) */
            for (var result in results) {
                if (results[result].article != null) {
                    articleNames[result] = decodeURI(results[result].article.value);
                    articleNames[result] = articleNames[result].replace("https://en.wikipedia.org/wiki/", "");
                    articleNames[result] = articleNames[result].replace(/_/g, " ");
                }
            }
            try {
                var extracts = await getWPExtracts(articleNames);
            } catch (error) {
                showApiConnectionError();
                return resolve();
            }
            /* Show results */
            var previous;
            console.log(results);
            for (var result in results) {
                var resultHeader = $("<div></div>").addClass("collapsible-header");
                var resultBody = $("<div></div>").addClass("collapsible-body");
                var r = results[result];
                if (r.object.value != previous) {
                    if (extracts[result] != null) {
                        /* Show available Wikipedia extract */
                        if (r.objectDescription != null) {
                            resultHeader.text(r.objectLabel.value + " (" + r.objectDescription.value + ")");
                        } else {
                            resultHeader.text(r.objectLabel.value);
                        }
                        console.log(r);
                        if (r.picture && r.picture.type === "uri") {
                            const uri = r.picture.value;
                            const image = $("<img />").attr("src", uri)
                                .css({
                                    width: "30%",
                                    float: "left",
                                    marginRight: "16px",
                                    marginTop: "16px"
                                });
                            resultBody.append(image)
                        }
                        resultBody.append(extracts[result]);
                    } else {
                        /* Show Wikidata description */
                        if (r.objectDescription == null) {
                            continue;
                        }
                        var name = r.objectLabel.value;
                        var description = r.objectDescription.value;
                        resultHeader.text(name);
                        if (r.died == null) {
                            resultBody.text(name + " is " + description);
                        } else {
                            resultBody.text(name + " was " + description);
                        }
                    }
                    previous = r.object.value;
                    resultElem.append(resultHeader);
                    resultElem.append(resultBody);
                    $("#resultArea").append(resultElem);
                    resultElem = $("<li></li>");
                }
            }
            resolve();
        });
    }

    function showApiConnectionError() {
        var error = $("<p></p>").text("Couldn't connect to the internet. Check your connection and try again.");
        hideLoadingSpinner();
        showError(error);
    }

    function getWDResponse(sparqlQuery) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                type: 'POST',
                url: "https://query.wikidata.org/sparql",
                data: {
                    query: sparqlQuery,
                    format: 'json'
                },
                dataType: 'json',
                timeout: 5000,
                success: function(jsondata) {
                    resolve(jsondata);
                },
                error: function() {
                    reject("Unable to load data from API");
                }
            });
        });
    }

    function getWPExtracts(titles) {
        var filteredTitles = titles.filter(function(elem) {
            return elem != null;
        });
        var joinedTitles = filteredTitles.join("|");
        return new Promise(function(resolve, reject) {
            $.ajax({
    			type: 'POST',
    			url: "https://en.wikipedia.org/w/api.php",
    			data: {
    				format: 'json',
    				action: 'query',
    				prop: 'extracts',
    				exintro: '1',
    				exlimit: '20',
    				exsectionformat: 'plain',
    				titles: joinedTitles,
    				origin: '*'
    			},
    			dataType: 'json',
    			timeout: 5000,
    			success: function(jsondata) {
                    var extracts = [];
                    for (var i = 0; i < titles.length; i++) {
                        for (var page in jsondata.query.pages) {
                            if (jsondata.query.pages[page].title == titles[i]) {
                                extracts[i] = jsondata.query.pages[page].extract;
                            }
                        }
                    }
                    resolve(extracts);
                },
                error: function() {
                    reject("Unable to load infromation from API");
                }
            });
        });
    }

    function spellCheck(subject) {
        return new Promise(async function(resolve, reject) {
            try {
                var spellchecked = await spellCheckOnWikidata(subject);
                if (spellchecked != null) {
                    return resolve(spellchecked);
                }
                spellchecked = await spellCheckOnWikipedia(subject);
                if (spellchecked != null) {
                    spellchecked = await spellCheckOnWikidata(spellchecked);
                    return resolve(spellchecked);
                }
                resolve(null);
            } catch (error) {
                reject("Unable to load information from API");
            }
        });
    }

    function spellCheckOnWikidata(subject) {
        return new Promise(function(resolve, reject) {
            /* Attempt to search on Wikidata */
            $.ajax({
        		type: 'POST',
        		url: "https://www.wikidata.org/w/api.php",
        		data: {
        			format: 'json',
        			action: 'wbsearchentities',
        			search: subject,
        			language: 'en',
        			origin: '*'
        		},
        		dataType: 'json',
        		timeout: 5000,
        		success: function(wdjsondata) {
                    if (wdjsondata.search.length > 0) {
                        resolve(wdjsondata.search[0].label);
                    } else {
                        resolve(null);
                    }
                },
                error: function() {
                    reject("Unable to load data from API");
                }
            });
        });
    }

    function spellCheckOnWikipedia(subject) {
        return new Promise(function(resolve, reject) {
            /* Attempt to search on Wikipedia */
            $.ajax({
                type: 'POST',
        		url: "https://en.wikipedia.org/w/api.php",
        		data: {
        			format: 'json',
        			action: 'opensearch',
        			search: subject,
        			limit: '10',
        			namespace: '0',
        			origin: '*'
        		},
        		dataType: 'json',
        		timeout: 5000, //5 s timeout
        		success: function(wpjsondata) {
                    if (wpjsondata[1].length > 0) {
                        var bestFound = wpjsondata[1][0];
                        bestFound = bestFound.replace(/\(.+?\)/g, "");
                        bestFound = bestFound.trim();
                        resolve(bestFound);
                    } else {
                        resolve(null);
                    }
                },
                error: function() {
                    reject("Unable to load data from API");
                }
            });
        });
    }
});
