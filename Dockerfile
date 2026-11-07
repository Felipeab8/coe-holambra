FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 HOST=0.0.0.0 PORT=8080 COE_DATA_DIR=/data
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && groupadd --system coe && useradd --system --gid coe coe && mkdir /data && chown coe:coe /data
COPY --chown=coe:coe . .
USER coe
VOLUME ["/data"]
EXPOSE 8080
CMD ["python", "servidor.py"]
