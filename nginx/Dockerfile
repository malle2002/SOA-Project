FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=frontend /usr/src/app/.next /usr/share/nginx/html/.next
COPY --from=frontend /usr/src/app/public /usr/share/nginx/html/public

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]