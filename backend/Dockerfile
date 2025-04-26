FROM ubuntu:22.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    openjdk-11-jdk \
    git wget curl unzip \
    && rm -rf /var/lib/apt/lists/*

# Install solc-select for Solidity compiler
RUN pip3 install solc-select
RUN solc-select install 0.8.0 && solc-select use 0.8.0

# Install Z3 solver
RUN wget https://github.com/Z3Prover/z3/releases/download/z3-4.12.2/z3-4.12.2-x64-glibc-2.35.zip \
    && unzip z3-4.12.2-x64-glibc-2.35.zip \
    && mv z3-4.12.2-x64-glibc-2.35/bin/z3 /usr/bin/ \
    && rm -rf z3-4.12.2-x64-glibc-2.35*

# Clone Certora Prover
RUN git clone https://github.com/Certora/CertoraProver.git /CertoraProver
WORKDIR /CertoraProver

# Set up Python virtual environment for Certora
RUN python3 -m venv .venv
RUN . .venv/bin/activate && pip install certora-cli

# Add Z3 to PATH
ENV PATH="/usr/bin:$PATH"

# Command to keep container running
CMD ["/bin/bash"]