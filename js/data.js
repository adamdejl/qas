"use strict"

var data = {
    0: {
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
    1: {
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
    2: {
        type: "genericWd",
        patterns: {
            0: /what\s+was\s+(.+?)\s+born\??$/i,
            1: /what\s+is\s+the\s+date\s+of\s+birth\s+of\s+(.+?)\??$/i
        },
        inputs: {
            0: "$searchedObject"
        },
        results: {
            0: "born"
        },
        output: "$searchedObject was born on $born",
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
    3: {
        type: "news",
        patterns: {
          0: /tell\s+me\s+the\s+(.+?)\s+from\s+(.+?)\.?$/i,
          1: /what\s+are\s+the\s+(.+?)\s+from\s+(.+?)\??$/i,
          2: /what\s+are\s+(.+?)\s+from\s+(.+?)\??$/i,
          3: /show\s+me\s+(.+?)\s+from\s+(.+?)\.?$/i,
          4: /show\s+(.+?)\s+from\s+(.+?)\.?$/i,
          5: /show\s+the\s+(.+?)\s+from\s+(.+?)\.?$/i,
          6: /show\s+me\s+the\s+(.+?)\s+from\s+(.+?)\.?$/i,
          7: /what\s+are\s+the\s+(.+?)\s+of\s+(.+?)\??$/i,
        },
        inputs: {
          0: "$ntype",
          1: "$nsource"
        }
    }
}
