import requests
import pprint
import json
from urllib import quote

API_KEY = "01D32981DB766D4CED24F3D339054FB9:11:67517747"
path = "../data/countries.txt"
out_path = "../data/articles_by_country.json"

def main():
  article_counts = {}
  with open(path) as f:
    for country in f:
      country = country.rstrip()
      queries = {
        "q": country,
        "sort": "oldest",
        "begin_date": "20130101",
        "end_date": "20131231",
        "fq": 'source:("The New York Times")',
        "api-key": API_KEY
      }    
      querystring = get_querystring(queries)
      r = requests.get(querystring).json()
      hits = r['response']['meta']['hits']
      print "%s : %d" % (country, hits)
      article_counts[country] = hits

  with open(out_path, 'w') as outfile:
    json.dump(article_counts, outfile)


def get_querystring(queries):
  base = "http://api.nytimes.com/svc/search/v2/articlesearch.json?"
  params = ["%s=%s" % (k, v.replace(" ", "+")) for k, v in queries.items()]
  qs = "%s%s" % (base, '&'.join(params))
  return qs


if __name__ == "__main__":
  main()
