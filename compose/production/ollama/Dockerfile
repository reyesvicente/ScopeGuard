FROM docker.io/ollama/ollama:0.40.3

COPY ./start /start-ollama
RUN sed -i 's/\r$//g' /start-ollama && chmod +x /start-ollama

ENV OLLAMA_HOST=0.0.0.0:11434

ENTRYPOINT ["/start-ollama"]
