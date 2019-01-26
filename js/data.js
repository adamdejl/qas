"use strict"

var data = {
    0: {
        type: "who",
        patterns: {
            0: /who is (.+?)\??$/i,
            1: /who was (.+?)\??$/i
        },
        inputs: {
            0: "$searchedPerson"
        },
        query: `
            SELECT ?person ?personLabel ?personDescription ?article ?died ?picture (COUNT(DISTINCT ?sitelink) AS ?count) WHERE {
              ?person rdfs:label|skos:altLabel "$searchedPerson"@en .
              OPTIONAL {
                ?article schema:isPartOf <https://en.wikipedia.org/>;
                  schema:about ?person.
              }
              OPTIONAL {
                ?person wdt:P570 ?died .
              }
              OPTIONAL {
                ?sitelink schema:about ?person .
              }
              OPTIONAL {
                ?person wdt:P18 ?picture .
              }
              SERVICE wikibase:label {
                bd:serviceParam wikibase:language "en" .
              }
              {FILTER EXISTS{?person wdt:P31 wd:Q5}}
              UNION
              {FILTER EXISTS{?person wdt:P31/wdt:P279* wd:Q95074}}
            }
            GROUP BY ?person ?personLabel ?personDescription ?article ?died ?picture
            ORDER BY DESC(?count)`
    }
}
