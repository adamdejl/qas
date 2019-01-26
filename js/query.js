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

    function processQuery(query) {
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
    }
});
