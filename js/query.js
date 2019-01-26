"use strict"

jQuery(function($) {
    $("#querySubmit").click(function() {
        processQuery($("#queryInput").val());
    });

    $(document).keydown(function(key) {
        if (key.which == 13) {
            processQuery($("#queryInput").val());
        }
    });

    async function processQuery(query) {
        /* Parse the query using pre-defined database of patterns data
         * Store data about query in queryData
         * Store list of required inputs in queryInputs
         * Update matched to true in case of match
         */
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
        /* Clean resultArea */
        $("#resultArea").text("");
        /* Process the given type of query */
        switch (queryData.type) {
            case "who":
                var sparqlQuery = queryData.query.replace(queryData.inputs[0], queryInputs[0])
                var resultElem = $("<div></div>").addClass("result_elem");
                var success;
                try {
                    var response = await getWDResponse(sparqlQuery);
                    success = true;
                } catch (error) {
                    success = false;
                }
                if (success) {
                    var results = response.results.bindings;
                    if (results.length == 0) {
                        resultElem.text("Unfortunately, your query did not match any items.")
                        $("#resultArea").append(resultElem);
                    } else {
                        for (var result in results) {
                            resultElem
                        }
                    }
                } else {
                    resultElem.text("Unable to load data from API, please check your internet"
                        + "and try again later.");
                    resultElem.css("color", "red");
                }
                break;
        }
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
                    reject();
                }
            });
        });
    }

    fuction getWPExtracts(titles) {
        return new Promise(fundtion(resolve, reject) {
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
    				titles: titles,
    				origin: '*'
    			},
    			dataType: 'json',
    			timeout: 5000,
    			success: function(jsondata) {
                    resolve(jsondata);
                },
                error: function() {
                    reject();
                }
            });
        });
    }
});
