import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Qui potresti impostare CORS in modo restrittivo come in Node, ma per semplicità lo abilito per tutti:
CORS(app)

# Carichiamo il JSON in memoria
try:
    with open("dati_centraline.json", "r", encoding="utf-8") as f:
        DATI = json.load(f)
        print(f"Caricati {len(DATI)} record dal file JSON.")
except Exception as e:
    print("Errore caricando dati_centraline.json:", e)
    DATI = []

# Se vuoi loggare qualche record a scopo di debug:
# print(DATI[:3])

####################################################
# 1) GET /search/original?modello=&ECU=&spn=
####################################################
@app.route("/search/original", methods=["GET"])
def search_original():
    modello = request.args.get("modello", "").strip()
    ECU = request.args.get("ECU", "").strip()
    spn = request.args.get("spn", "").strip()

    # Parametri obbligatori
    if not modello or not ECU or not spn:
        return jsonify({"error": "Modello, ECU e SPN sono obbligatori."}), 400

    # Filtra
    results = [
        d for d in DATI
        if d.get("modello") == modello
           and d.get("ECU") == ECU
           and d.get("SPN") == spn
    ]

    if not results:
        return jsonify({"error": "Nessun record trovato per la ricerca originale."}), 404

    # Restituisce la lista raw, come Node faceva con res.json(results)
    return jsonify(results)

####################################################
# 2) GET /search/spn-fmi?spn=&fmi=&modello= (opzionale)
####################################################
@app.route("/search/spn-fmi", methods=["GET"])
def search_spn_fmi():
    spn = request.args.get("spn", "").strip()
    fmi = request.args.get("fmi", "").strip()
    modello = request.args.get("modello", "").strip()  # opzionale

    if not spn or not fmi:
        return jsonify({"error": "SPN e FMI sono obbligatori."}), 400

    # Costruisci il filtro
    def match(record):
        # Prima controlla spn e fmi
        if record.get("SPN") != spn or record.get("FMI") != fmi:
            return False
        # Se modello è presente, filtriamo anche su modello
        if modello and record.get("modello") != modello:
            return False
        return True

    results = [d for d in DATI if match(d)]

    if not results:
        return jsonify({"error": "Nessun record trovato per la ricerca SPN/FMI."}), 404

    return jsonify(results)

####################################################
# 3) GET /search/codice-sdf?modello=&codice-sdf=
####################################################
@app.route("/search/codice-sdf", methods=["GET"])
def search_codice_sdf():
    modello = request.args.get("modello", "").strip()
    codice_sdf = request.args.get("codice-sdf", "").strip()

    if not modello or not codice_sdf:
        return jsonify({"error": "Modello e Codice SDF sono obbligatori."}), 400

    results = [
        d for d in DATI
        if d.get("modello") == modello
           and d.get("Codice SDF", "").strip() == codice_sdf
    ]

    if not results:
        return jsonify({"error": "Nessun record trovato per la ricerca del Codice SDF."}), 404

    return jsonify(results)

####################################################
# 4) GET /centraline?modello=...
#    Restituisce la lista DISTINCT di "ID_CENTRALINA" per il modello
####################################################
@app.route("/centraline", methods=["GET"])
def get_centraline():
    # Verifica che ci sia solo 'modello' come parametro
    if len(request.args) != 1 or "modello" not in request.args:
        return jsonify({"error": "Server error."}), 400

    modello = request.args.get("modello", "").strip()
    print(f"Richiesta per ID_CENTRALINA con modello={modello}")

    if not modello:
        return jsonify({"error": "Server error."}), 400

    # Filtra i record
    filtered = [d for d in DATI if d.get("modello") == modello]

    if not filtered:
        return jsonify({"error": "Nessuna ID_CENTRALINA trovata per il modello fornito."}), 404

    # Simile a "distinct": estrai i diversi "ID_CENTRALINA"
    distinct_ids = sorted(list({d.get("ID_CENTRALINA", "") for d in filtered if d.get("ID_CENTRALINA")}))
    if not distinct_ids:
        return jsonify({"error": "Nessuna ID_CENTRALINA trovata per il modello fornito."}), 404

    return jsonify(distinct_ids)

####################################################
# Gestione errori globali per restituire sempre JSON
####################################################
@app.errorhandler(404)
def handle_404(e):
    return jsonify({"error": "Endpoint non trovato"}), 404

@app.errorhandler(500)
def handle_500(e):
    return jsonify({"error": "Errore interno del server"}), 500

####################################################
# Avvio del server
####################################################
if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=PORT, debug=False)
