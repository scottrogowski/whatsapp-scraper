# Strapi application

A quick description of your strapi application

## Caveats

-> Times used in this app
google api : UTC timezone formatted as an ISO 8601 String

record.json file inside /api/api/gdrive-scraper/service/core keeps track of metadata from the last time the scraper was run
When the scraper hasn't been run even once, it should be an empty JSON object like `{}`
and when it has been run once or more, it should look like

```
{
    'group-id-a': {
        'lastScrapedMessageTime': '2020-09-25T10:48:16.941Z'
        'modifiedTime: '2020-09-23T10:48:16.941Z'
    }
    .
    .
    .
}
```

Timestamp is of the form ISO string
modifiedTime represents the time this folder was modified on google drive
lastScrapedMessageTime is the time this folder was downloaded by our scraper

One can run the scraper as many times. its only when we try to sync the downloaded messages into the database that we should be careful
