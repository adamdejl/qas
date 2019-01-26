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
                var sparqlQuery = queryData.query.replace(queryData.inputs[0], queryInputs[0])
                var resultElem = $("<li></li>");

                try {
                    var response = await getWDResponse(sparqlQuery);
                } catch (error) {
                    showApiConnectionError();
                    return;
                }
                /* API request succeeded */
                var results = response.results.bindings;
                if (results.length == 0) {
                    /* No match found - spellcheck */
                    try {
                        var spellchecked = await spellCheck(queryInputs[0]);
                    } catch (error) {
                        showApiConnectionError();
                        return;
                    }
                    console.log(spellchecked);
                    if (spellchecked == null) {
                        /* No element found */
                        var error = $("<p></p>").text("Oops, nothing here. Try another query.");
                        hideLoadingSpinner();
                        showError(error);
                        return;
                    }
                    /* Match found during spellcheck - try to start again with new subject */
                    sparqlQuery = queryData.query.replace(queryData.inputs[0], spellchecked)
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
                    return;
                }
                /* Show results */
                var previous;
                for (var result in results) {
                    var resultHeader = $("<div></div>").addClass("collapsible-header");
                    var resultBody = $("<div></div>").addClass("collapsible-body");
                    if (results[result].person.value != previous) {
                        if (extracts[result] != null) {
                            var r = results[result];
                            /* Show available Wikipedia extract */
                            if (r.personDescription != null) {
                                resultHeader.text(r.personLabel.value + " (" + r.personDescription.value + ")");
                            } else {
                                resultHeader.text(r.personLabel.value);
                            }
                            resultBody.html(extracts[result]);
                        } else {
                            /* Show Wikidata description */
                            var name = r.personLabel.value;
                            var description = r.personDescription.value;
                            resultHeader.text(name);
                            if (r.died == null) {
                                resultBody.text(name + " is " + description);
                            } else {
                                resultBody.text(name + " was " + description);
                            }
                        }
                        previous = r.person.value;
                        resultElem.append(resultHeader);
                        resultElem.append(resultBody);
                        $("#resultArea").append(resultElem);
                        resultElem = $("<li></li>");
                    }
                }
                break;
        }

        hideLoadingSpinner();
        showResults();
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
