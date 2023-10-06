FROM alpine:latest
MAINTAINER YoMo <cc@yomo.run>

# RUN set -xe \
#  && sysctl -w net.core.rmem_max=2500000 \
#  && sysctl -w net.core.wmem_max=2500000

WORKDIR /app

COPY dist/prscd-x86_64-linux ./prscd

EXPOSE 8443/tcp
EXPOSE 8443/udp
EXPOSE 61226

CMD ["/app/prscd"]
