FROM python:3.12-slim

WORKDIR /cash_register

COPY cash_register_simulator.py .

RUN mkdir -p ./transactions

CMD ["python", "cash_register_simulator.py"]
