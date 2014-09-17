#!/bin/bash
export HTTP_FORWARDED_COUNT=1
# Don't listen on public interface of port 3000.
export ROOT_URL=https://trashmountain.comg/giveDev
meteor --port=localhost:58280 --settings settings.json