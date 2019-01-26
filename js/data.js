"use strict"

var data = {
    0: {
        type: "who",
        patterns: {
            0: /who is (.+?)\??$/i,
            1: /who was (.+?)\??$/i
        },
        inputs: {
            0: "$searchedObject"
        },
        query: `
            SELECT ?object ?objectLabel ?objectDescription ?article ?ended ?picture (COUNT(DISTINCT ?sitelink) AS ?count) WHERE {
              ?object rdfs:label|skos:altLabel "$searchedObject"@en .
              OPTIONAL {
                ?article schema:isPartOf <https://en.wikipedia.org/>;
                  schema:about ?object.
              }
              OPTIONAL {
                ?object wdt:P570 ?ended .
              }
              OPTIONAL {
                ?sitelink schema:about ?object .
              }
              OPTIONAL {
                ?object wdt:P18 ?picture .
              }
              SERVICE wikibase:label {
                bd:serviceParam wikibase:language "en" .
              }
              {FILTER EXISTS{?object wdt:P31 wd:Q5}}
              UNION
              {FILTER EXISTS{?object wdt:P31/wdt:P279* wd:Q95074}}
            }
            GROUP BY ?object ?objectLabel ?objectDescription ?article ?ended ?picture
            ORDER BY DESC(?count)`
    },
    1: {
        type: "what",
        patterns: {
            0: /what is (.+?)\??$/i,
            1: /what was (.+?)\??$/i
        },
        inputs: {
            0: "$searchedObject"
        },
        query: `
            SELECT ?object ?objectLabel ?objectDescription ?article ?ended ?picture (COUNT(DISTINCT ?sitelink) AS ?count) WHERE {
              ?object rdfs:label|skos:altLabel "London"@en .
              OPTIONAL {
                ?article schema:isPartOf <https://en.wikipedia.org/>;
                  schema:about ?object.
              }
              OPTIONAL {
                ?object wdt:P576 ?ended .
              }
              OPTIONAL {
                ?sitelink schema:about ?object .
              }
              OPTIONAL {
                ?object wdt:P18 ?picture .
              }
              SERVICE wikibase:label {
                bd:serviceParam wikibase:language "en" .
              }
              FILTER NOT EXISTS{?object wdt:P31 wd:Q5}
              FILTER NOT EXISTS{?object wdt:P31 wd:Q4167410}
              FILTER NOT EXISTS{?object wdt:P31/wdt:P279* wd:Q18616576}
            }
            GROUP BY ?object ?objectLabel ?objectDescription ?article ?ended ?picture
            ORDER BY DESC(?count)`
    },
    2: {
        type: "whenBorn",
        patterns: {
            0: /what was (.+?) born\??$/i,
            1: /what is the date of birth of (.+?)\??$/i
        },
        inputs: {
            0: "$searchedObject"
        },
        query: `
            SELECT ?object ?objectLabel ?objectDescription ?article ?ended ?picture (COUNT(DISTINCT ?sitelink) AS ?count) WHERE {
              ?object rdfs:label|skos:altLabel "London"@en .
              OPTIONAL {
                ?article schema:isPartOf <https://en.wikipedia.org/>;
                  schema:about ?object.
              }
              OPTIONAL {
                ?object wdt:P576 ?ended .
              }
              OPTIONAL {
                ?sitelink schema:about ?object .
              }
              OPTIONAL {
                ?object wdt:P18 ?picture .
              }
              SERVICE wikibase:label {
                bd:serviceParam wikibase:language "en" .
              }
              FILTER NOT EXISTS{?object wdt:P31 wd:Q5}
              FILTER NOT EXISTS{?object wdt:P31 wd:Q4167410}
              FILTER NOT EXISTS{?object wdt:P31/wdt:P279* wd:Q18616576}
            }
            GROUP BY ?object ?objectLabel ?objectDescription ?article ?ended ?picture
            ORDER BY DESC(?count)`
    }
}
