# Dev dockerfile used to aggregate all of the deployment dependencies (start via compose to have correct volume mounts)

FROM ubuntu:20.04

ARG SOPS_VERSION=v3.7.1

RUN apt-get update && \
    apt-get -y install \
    # common packages
    openssh-client \
    curl \
    python3 \
    python3-pip \
    git \
    gnupg \
    # some of script dependencies
    direnv \
    ipcalc \
    jq \
    # envsubst
    gettext-base && \
    # cleanup
    rm -rf /var/lib/apt/lists/*

# Kubectl
COPY --from=bitnami/kubectl /opt/bitnami/kubectl/bin/kubectl /usr/local/bin/

# Helm
COPY --from=alpine/helm /usr/bin/helm /usr/local/bin/

# Ansible
RUN pip3 install ansible

# go-task
RUN bash -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin

# Flux
RUN curl -s https://fluxcd.io/install.sh | bash

# Sops
RUN curl -Ls https://github.com/mozilla/sops/releases/download/$SOPS_VERSION/sops-$SOPS_VERSION.linux --output /usr/local/bin/sops

WORKDIR /root/development

CMD [ "/usr/bin/bash" ]
