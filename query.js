jQuery(function($) {
    $("#querySubmit").click(function() {
        processQuery($("#queryInput").val());
    });

    function processQuery(query) {
        console.log(query);
    }
});
