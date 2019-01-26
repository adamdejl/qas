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
        var queryMatch;
        var queryInputs = [];
        for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i].patterns; j++) {
                if (data[i].patterns[j].text(query)) {
                    
                }
            }
        }
    }
});
