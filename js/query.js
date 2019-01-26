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
        var queryData;
        var queryInputs = [];
        var matched = false;
        for (var i = 0; i < data.length; i++) {
            if (matched) {
                break;
            }
            for (var j = 0; j < data[i].patterns; j++) {
                var reExp = data[i].patterns[j];
                if (reExp.test(query)) {
                    queryData = data[i];
                    queryInputs = reExp.exec(query);
                    break;
                }
            }
        }
        console.log(queryData);
        console.log(queryInputs);
    }
});
