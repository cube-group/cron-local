FROM node:latest

ENV APP_NAME demo
ENV APP_PATH /var/www/html
#ENV APP_MONITOR_HOOK dingding-webhook

COPY . /extra/cron

CMD ['node','/extra/cron/start']