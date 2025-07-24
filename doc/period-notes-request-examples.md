## General Notes

Each endpoint has two URL patterns:
- `/periodic/{period}/` for the current day
- `/periodic/{period}/YYYY/MM/DD/` for a specific date
- The `{period}` can be `daily`, `weekly`, `monthly`, `quarterly`,or `yearly`.


## Examples

```
curl -X 'DELETE' \
  'https://127.0.0.1:27124/periodic/daily/' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer bde7fa8bc00fbc576950a5d19243c774c2a7358a57c4215bb2a56f11123763be'
```

```
curl -X 'POST' \
  'https://127.0.0.1:27124/periodic/daily/' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer bde7fa8bc00fbc576950a5d19243c774c2a7358a57c4215bb2a56f11123763be' \
  -H 'Content-Type: text/markdown' \
  -d '# This is my document

something else here
'
```

```
curl -X 'PUT' \
  'https://127.0.0.1:27124/periodic/daily/' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer bde7fa8bc00fbc576950a5d19243c774c2a7358a57c4215bb2a56f11123763be' \
  -H 'Content-Type: */*' \
  -d 'foobar foobar'
```

```
curl -X 'GET' \
  'https://127.0.0.1:27124/periodic/daily/' \
  -H 'accept: application/vnd.olrapi.note+json' \
  -H 'Authorization: Bearer bde7fa8bc00fbc576950a5d19243c774c2a7358a57c4215bb2a56f11123763be'
```

```
curl -X 'GET' \
  'https://127.0.0.1:27124/periodic/daily/2025/07/23/' \
  -H 'accept: application/vnd.olrapi.note+json' \
  -H 'Authorization: Bearer bde7fa8bc00fbc576950a5d19243c774c2a7358a57c4215bb2a56f11123763be'
```

```
curl -X 'DELETE' \
  'https://127.0.0.1:27124/periodic/daily/2025/07/23/' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer bde7fa8bc00fbc576950a5d19243c774c2a7358a57c4215bb2a56f11123763be'
```

## NOTES on PATCH Endpoints

URL can be 'https://127.0.0.1:27124/periodic/daily/' or 'https://127.0.0.1:27124/periodic/daily/2025/07/23/'

```
Inserts content into the current periodic note for the specified period relative to a heading, block refeerence, or frontmatter field within that document.

Allows you to modify the content relative to a heading, block reference, or frontmatter field in your document.

Note that this API was changed in Version 3.0 of this extension and the earlier PATCH API is now deprecated. Requests made using the previous version of this API will continue to work until Version 4.0 is released. See https://github.com/coddingtonbear/obsidian-local-rest-api/wiki/Changes-to-PATCH-requests-between-versions-2.0-and-3.0 for more details and migration instructions.

Examples
All of the below examples assume you have a document that looks like this:

---
alpha: 1
beta: test
delta:
zeta: 1
yotta: 1
gamma:
- one
- two
---

# Heading 1

This is the content for heading one

Also references some [[#^484ef2]]

## Subheading 1:1
Content for Subheading 1:1

### Subsubheading 1:1:1

### Subsubheading 1:1:2

Testing how block references work for a table.[[#^2c7cfa]]
Some content for Subsubheading 1:1:2

More random text.

^2d9b4a

## Subheading 1:2

Content for Subheading 1:2.

some content with a block reference ^484ef2

## Subheading 1:3
| City         | Population |
| ------------ | ---------- |
| Seattle, WA  | 8          |
| Portland, OR | 4          |

^2c7cfa
Append Content Below a Heading
If you wanted to append the content "Hello" below "Subheading 1:1:1" under "Heading 1", you could send a request with the following headers:

Operation: append
Target-Type: heading
Target: Heading 1::Subheading 1:1:1
with the request body: Hello
The above would work just fine for prepend or replace, too, of course, but with different results.

Append Content to a Block Reference
If you wanted to append the content "Hello" below the block referenced by "2d9b4a" above ("More random text."), you could send the following headers:

Operation: append
Target-Type: block
Target: 2d9b4a
with the request body: Hello
The above would work just fine for prepend or replace, too, of course, but with different results.

Add a Row to a Table Referenced by a Block Reference
If you wanted to add a new city ("Chicago, IL") and population ("16") pair to the table above referenced by the block reference 2c7cfa, you could send the following headers:

Operation: append
TargetType: block
Target: 2c7cfa
Content-Type: application/json
with the request body: [["Chicago, IL", "16"]]
The use of a Content-Type of application/json allows the API to infer that member of your array represents rows and columns of your to append to the referenced table. You can of course just use a Content-Type of text/markdown, but in such a case you'll have to format your table row manually instead of letting the library figure it out for you.

You also have the option of using prepend (in which case, your new row would be the first -- right below the table heading) or replace (in which case all rows except the table heading would be replaced by the new row(s) you supplied).

Setting a Frontmatter Field
If you wanted to set the frontmatter field alpha to 2, you could send the following headers:

Operation: replace
TargetType: frontmatter
Target: beep
with the request body 2
If you're setting a frontmatter field that might not already exist you may want to use the Create-Target-If-Missing header so the new frontmatter field is created and set to your specified value if it doesn't already exist.

You may find using a Content-Type of application/json to be particularly useful in the case of frontmatter since frontmatter fields' values are JSON data, and the API can be smarter about interpreting yoru prepend or append requests if you specify your data as JSON (particularly when appending, for example, list items).


```