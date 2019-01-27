"use strict"

var data = {
    0: {
        type: "wOfWhat",
        patterns: {
            0: /what\s+is\s+the\s+(.+?)\s+of\s+(.+?)\??$/i,
            1: /what\s+is\s+(.+?)\s+of\s+(.+?)\??$/i,
            2: /what\s+are\s+the\s+(.+?)\s+of\s+(.+?)\??$/i,
            3: /what\s+are\s+(.+?)\s+of\s+(.+?)\??$/i,
            4: /who\s+is\s+the\s+(.+?)\s+of\s+(.+?)\??$/i,
            5: /who\s+is\s+(.+?)\s+of\s+(.+?)\??$/i,
            6: /who\s+are\s+the\s+(.+?)\s+of\s+(.+?)\??$/i,
            7: /who\s+are\s+(.+?)\s+of\s+(.+?)\??$/i,
            8: /(.+?)\s+of\s+(.+?)\??$/i,
            9: /(.+?)\s+of\s+(.+?)\??$/i
        },
        inputs: {
            0: "$searchedObject"
        },
        replacement: "resultLabel",
        header: "$resultLabel $be the $propertyNum of $searchedObject.",
        options: {
            0: "$be",
            1: "$propertyNum"
        },
        singulars: {
            0: "is"
        },
        plurals: {
            0: "are",
        },
        query: `
            SELECT ?object ?objectLabel ?objectDescription ?result ?resultLabel (COUNT(DISTINCT ?sitelink) AS ?count) WHERE {
              ?object rdfs:label|skos:altLabel "$searchedObject"@en .
              ?object wdt:$property ?result .
              OPTIONAL {
                ?sitelink schema:about ?object .
              }
              SERVICE wikibase:label {
                bd:serviceParam wikibase:language "en" .
              }
              FILTER NOT EXISTS{?object wdt:P31 wd:Q4167410}
              FILTER NOT EXISTS{?object wdt:P31/wdt:P279* wd:Q18616576}
            }
            GROUP BY ?object ?objectLabel ?objectDescription ?result ?resultLabel
            ORDER BY DESC(?count)`
    },
    1: {
        type: "whoOrWhat",
        patterns: {
            0: /who\s+is\s+(.+?)\??$/i,
            1: /who\s+was\s+(.+?)\??$/i
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
    2: {
        type: "whoOrWhat",
        patterns: {
            0: /what\s+is\s+a\s+(.+?)\??$/i,
            1: /what\s+is\s+(.+?)\??$/i,
            2: /what\s+was\s+(.+?)\??$/i
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
    3: {
        type: "genericWdNoBody",
        patterns: {
            0: /when\s+was\s+(.+?)\s+born\??$/i,
            1: /what\s+is\s+the\s+date\s+of\s+birth\s+of\s+(.+?)\??$/i
        },
        inputs: {
            0: "$searchedObject"
        },
        replacements: {
            0: "born"
        },
        replacementTypes: {
            0: "date"
        },
        header: "$searchedObject was born on $born.",
        query: `
            SELECT ?object ?objectLabel ?objectDescription ?article ?born ?picture (COUNT(DISTINCT ?sitelink) AS ?count) WHERE {
              ?object rdfs:label|skos:altLabel "$searchedObject"@en .
              ?object wdt:P569 ?born .
              OPTIONAL {
                ?article schema:isPartOf <https://en.wikipedia.org/>;
                  schema:about ?object.
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
              FILTER NOT EXISTS{?object wdt:P31 wd:Q4167410}
              FILTER NOT EXISTS{?object wdt:P31/wdt:P279* wd:Q18616576}
            }
            GROUP BY ?object ?objectLabel ?objectDescription ?article ?born ?picture
            ORDER BY DESC(?count)`
    },
    4: {
        type: "genericWdNoBody",
        patterns: {
            0: /when\s+did\s+(.+?)\s+die\??$/i,
            1: /what\s+is\s+the\s+date\s+of\s+death\s+of\s+(.+?)\??$/i
        },
        inputs: {
            0: "$searchedObject"
        },
        replacements: {
            0: "died"
        },
        replacementTypes: {
            0: "date"
        },
        header: "$searchedObject died on $died.",
        query: `
            SELECT ?object ?objectLabel ?objectDescription ?article ?died ?picture (COUNT(DISTINCT ?sitelink) AS ?count) WHERE {
              ?object rdfs:label|skos:altLabel "$searchedObject"@en .
              ?object wdt:P570 ?died .
              OPTIONAL {
                ?article schema:isPartOf <https://en.wikipedia.org/>;
                  schema:about ?object.
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
              FILTER NOT EXISTS{?object wdt:P31 wd:Q4167410}
              FILTER NOT EXISTS{?object wdt:P31/wdt:P279* wd:Q18616576}
            }
            GROUP BY ?object ?objectLabel ?objectDescription ?article ?died ?picture
            ORDER BY DESC(?count)`
    },
    5: {
        type: "news",
        patterns: {
          0: /tell (?:me the|me) (.+?) (?:from|of) (.+?)\.?$/i,
          1: /what (?:are the|are) (.+?) (?:from|of) (.+?)\??$/i,
          2: /show (?:me the|me|the) (.+?) (?:from|of) (.+?)\.?$/i,
          3: /show (.+?) (?:from|of) (.+?)\.?$/i,
        },
        inputs: {
          0: "$ntype",
          1: "$nsource"
        }
    }
}
