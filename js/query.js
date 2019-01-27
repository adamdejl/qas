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
            case "whoOrWhat":
                var results = await getResultFromWd(queryData.query, queryData.inputs, queryInputs);
                await showWdAndWpResults(results);
                break;
            case "genericWdNoBody":
                var results = await getResultFromWd(queryData.query, queryData.inputs, queryInputs);
                showWdResultsNoBody(results, queryData, queryInputs);
                break;
            case "wOfWhat":
                console.log(queryInputs[0]);
                var propertyResults = await findWdProperty(queryInputs[0]);
                console.log(propertyResults);
                if (propertyResults == null) {
                    const error = $("<p>Couldn't understand the query. Try something else.</p>");
                    showError(error);
                    hideLoadingSpinner();
                    return;
                }
                var propertyId = propertyResults.id;
                var propertyName = propertyResults.label;
                /* Copy queryData and make substitutions */
                var queryDataModified = JSON.parse(JSON.stringify(queryData));
                queryDataModified.query = queryDataModified.query.replace("$property", propertyId);
                queryDataModified.singulars[1] = propertyName;
                queryDataModified.plurals[1] = propertyName + "s";
                queryInputs = queryInputs.splice(1);
                var results = await getResultFromWd(queryDataModified.query, queryData.inputs, queryInputs);
                showWdResultsNoBodyMultipleResults(results, queryDataModified, queryInputs);
                break;
            case "news":
                await(showNews(queryInputs));
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
                sparqlQuery = sparqlQuery.replace(inputs[input], values[input]);
            }
            console.log(sparqlQuery);
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
     * Shows results fetched only from Wikidata
     * Used for queries with short responses that fit to the header only and require single subject
     * Disables expansion of the body of the resultElems
     */
    function showWdResultsNoBodyMultipleResults (results, queryData, queryInputs) {
        var resultElem = $("<li></li>");
        var genericHeaderText = queryData.header;
        var previous;
        var result = 0;
        while (results[result] != null) {
            previous = results[result].object.value;
            var r = results[result];
            var resultsArr = [];
            while (results[result] != null && results[result].object.value == previous) {
                resultsArr.push(results[result][queryData.replacement].value);
                result++;
            }
            var resultHeader = $("<div></div>").addClass("collapsible-header");
            var resultBody = $("<div></div>").addClass("collapsible-body");
            var headerText = genericHeaderText;
            if (resultsArr.length > 1) {
                var val = resultsArr.slice(0, -1).join(", ");
                val += " and " + resultsArr[resultsArr.length - 1]
            } else {
                var val = resultsArr[0];
            }

            headerText = headerText.replace("$" + queryData.replacement, val);
            for (var option in queryData.options) {
                if (resultsArr.length > 1) {
                    headerText = headerText.replace(queryData.options[option], queryData.plurals[option]);
                } else {
                    headerText = headerText.replace(queryData.options[option], queryData.singulars[option]);
                }
            }
            if (r.objectDescription != null) {
                headerText = headerText.replace(queryData.inputs[0],
                    r.objectLabel.value + " (" + r.objectDescription.value + ")");
            } else {
                headerText = headerText.replace(queryData.inputs[0], r.objectLabel.value);
            }
            headerText = headerText.charAt(0).toUpperCase() + headerText.slice(1);
            resultHeader.text(headerText);
            resultElem.append(resultHeader);
            resultElem.append(resultBody);
            $("#resultArea").append(resultElem);
            resultElem = $("<li></li>");
        }
    }

    /*
     * Shows results fetched only from Wikidata
     * Used for queries with short responses that fit to the header only and require single subject
     * Disables expansion of the body of the resultElems
     */
    function showWdResultsNoBody (results, queryData, queryInputs) {
        var resultElem = $("<li></li>");
        var genericHeaderText = queryData.header;
        var previous;
        for (var result in results) {
            var r = results[result];
            if (r.object.value != previous) {
                var resultHeader = $("<div></div>").addClass("collapsible-header");
                var resultBody = $("<div></div>").addClass("collapsible-body");
                var headerText = genericHeaderText;

                for (var replacement in queryData.replacements) {
                    var replacementName = queryData.replacements[replacement];
                    var replacementType = queryData.replacementTypes[replacement];
                    var val = r[replacementName].value;
                    switch (replacementType) {
                        case "date":
                            var date = new Date(val);
                            val = date.toLocaleDateString();
                            break;
                    }
                    headerText = headerText.replace("$" + replacementName, val);
                }
                if (r.objectDescription != null) {
                    headerText = headerText.replace(queryData.inputs[0],
                        r.objectLabel.value + " (" + r.objectDescription.value + ")");
                } else {
                    headerText = headerText.replace(queryData.inputs[0], r.objectLabel.value);
                }
                resultHeader.text(headerText);
                resultElem.append(resultHeader);
                resultElem.append(resultBody);
                $("#resultArea").append(resultElem);
                resultElem = $("<li></li>");
                previous = r.object.value;
            }
        }
    }

    /*
     * Shows results fetched from Wikidata and Wikipedia
     * Used for queries of type "who and "what"
     * Excepts parameter result corresponding to results.bindings in json returned from WD
     */
    async function showWdAndWpResults (results) {
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
            return;
        }
        /* Show results */
        var previous;
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

    function findWdProperty(subject) {
        return new Promise(function(resolve, reject) {
            /* Attempt to search property on Wikidata */
            $.ajax({
        		type: 'POST',
        		url: "https://www.wikidata.org/w/api.php",
        		data: {
        			format: 'json',
        			action: 'wbsearchentities',
        			search: subject,
        			language: 'en',
                    type: 'property',
        			origin: '*'
        		},
        		dataType: 'json',
        		timeout: 5000,
        		success: function(wdjsondata) {
                    if (wdjsondata.search.length > 0) {
                        resolve(wdjsondata.search[0]);
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

    async function showNews(queryInputs) {
        var ntype = queryInputs[0];
        var nsource = queryInputs[1].replace(/\s+/g, '-').toLowerCase();
        const newsapikey = '54d5f0c4a6254a8bb2c3eaaf79d5a630';

        /* Processing the input */
        const sourcearray = [
            "BBC", "bbc-news", "bbc", "bbc-news", "the-guardian", "the-guardian-uk", "business-insider", "business-insider-uk"
        ];
        const typearray = [
            "recent news", "everything", "headlines", "top-headlines", "top news", "top-headlines", "news", "top-headlines",
            "articles", "top-headline", "latest news", "everything", "top headlines", "top-headlines"
        ]
        var i = 0
        for (i = 0; i < typearray.length; i = i + 2) {
            if (ntype == typearray[i]) {
                ntype = typearray[i+1];
            }
        };
        for (i = 0; i < sourcearray.length; i = i + 2) {
            if (nsource == sourcearray[i]) {
                nsource = sourcearray[i+1];
            }
        };

        const res1 = await fetch(`https://newsapi.org/v2/${ntype}?sources=${nsource}&apiKey=${newsapikey}`);
        const json = await res1.json();
        var articlearray = $.map(json, function(el) { return el });
        articlearray.shift();
        articlearray.shift();

        function createArticle(article) {
            return `
                <div>
                    <table style="width:100%">
                        <td style="width:30%">
                            <img style="max-width:100%" src="${article.urlToImage}">
                        </td>
                        <td style="vertical-align:top">
                            <p style="color:black">${article.description}</p>
                            <a href="${article.url}">
                                <p style="color:grey">Read more...</p>
                            </a>
                        </td>
                    </table>
                </div>
                `;
        }

        /* Show results */
        for (i = 0; i < articlearray.length; i++) {
            var resultElem = $("<li></li>");
            var resultHeader = $("<div></div>").addClass("collapsible-header");
            var resultBody = $("<div></div>").addClass("collapsible-body");

            resultHeader.text(articlearray[i].title);
            resultBody.html(createArticle(articlearray[i]));
            resultElem.append(resultHeader);
            resultElem.append(resultBody);
            $("#resultArea").append(resultElem);
        }
    }
});
