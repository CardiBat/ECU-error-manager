const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

// Carica le variabili d'ambiente solo se non sei in produzione
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Configurazione dell'applicazione
const app = express();
const PORT = process.env.PORT || 5000;

// Configura CORS per consentire solo l'origine del frontend
const allowedOrigins = [
    'https://x-x-x.netlify.app', // Sostituisci con il tuo dominio Netlify
    'http://localhost:3000',                       // Sostituisci se necessario
];

const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Origin non consentita da CORS'));
        }
    },
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Connessione a MongoDB Atlas
const mongoURL = process.env.MONGODB_URI;
const dbName = 'DBNEW';
const collectionName = 'dati-centraline';

let db, collection;

// Funzione per connettersi a MongoDB
async function connectToMongo() {
    try {
        const client = new MongoClient(mongoURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        await client.connect();
        console.log('Connesso a MongoDB Atlas');
        db = client.db(dbName);
        collection = db.collection(collectionName);
    } catch (error) {
        console.error('Errore di connessione a MongoDB:', error);
        process.exit(1); // Termina l'app se la connessione fallisce
    }
}

// Funzione per normalizzare le stringhe
function normalizeString(s) {
    if (typeof s !== 'string') return '';
    return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Endpoint /search
app.get('/search/original', async (req, res) => {
    const { modello, ECU, spn } = req.query;

    if (!modello || !ECU || !spn) {
        return res.status(400).json({ error: 'Modello, ECU e SPN sono obbligatori.' });
    }

    try {
        const query = {
            modello: modello,
            ECU: ECU,
            SPN: spn
        };

        const results = await collection.find(query).toArray();

        if (!results.length) {
            return res.status(404).json({ error: 'Nessun record trovato per la ricerca originale.' });
        }

        return res.json(results);
    } catch (error) {
        console.error('Errore durante la ricerca originale:', error);
        return res.status(500).json({ error: 'Errore interno del server' });
    }
});


app.get('/search/spn-fmi', async (req, res) => {
    const { spn, fmi, modello } = req.query;

    if (!spn || !fmi) {
        return res.status(400).json({ error: 'SPN e FMI sono obbligatori.' });
    }

    try {
        const query = {
            SPN: spn,
            FMI: fmi
        };

        if (modello) {
            query.modello = modello;
        }

        const results = await collection.find(query).toArray();

        if (!results.length) {
            return res.status(404).json({ error: 'Nessun record trovato per la ricerca SPN/FMI.' });
        }

        return res.json(results);
    } catch (error) {
        console.error('Errore durante la ricerca SPN/FMI:', error);
        return res.status(500).json({ error: 'Errore interno del server' });
    }
});


app.get('/search/codice-sdf', async (req, res) => {
    const { modello, 'codice-sdf': codiceSDF } = req.query;

    if (!modello || !codiceSDF) {
        return res.status(400).json({ error: 'Modello e Codice SDF sono obbligatori.' });
    }

    try {
        const query = {
            modello: modello,
            'Codice SDF': codiceSDF
        };

        const results = await collection.find(query).toArray();

        if (!results.length) {
            return res.status(404).json({ error: 'Nessun record trovato per la ricerca del Codice SDF.' });
        }

        return res.json(results);
    } catch (error) {
        console.error('Errore durante la ricerca Codice SDF:', error);
        return res.status(500).json({ error: 'Errore interno del server' });
    }
});



// Nuova endpoint /centraline
app.get('/centraline', async (req, res) => {
    const { modello } = req.query;

    // Verifica che solo 'modello' sia passato come parametro
    if (!modello || Object.keys(req.query).length !== 1) {
        return res.status(400).json({
            error: "Server error."
        });
    }

    console.log(`Richiesta per ID_CENTRALINA con Modello=${modello}`);

    try {
        // Utilizza il metodo distinct per ottenere valori unici di ID_CENTRALINA
        const uniqueCentraline = await collection.distinct("ID_CENTRALINA", { modello: modello });

        if (!uniqueCentraline.length) {
            return res.status(404).json({ error: 'Nessuna ID_CENTRALINA trovata per il modello fornito.' });
        }

        return res.json(uniqueCentraline);
    } catch (error) {
        console.error('Errore durante la ricerca delle ID_CENTRALINA:', error);
        return res.status(500).json({ error: 'Errore interno del server' });
    }
});



// Avvia l'app dopo aver connesso a MongoDB
connectToMongo().then(() => {
    app.listen(PORT, () => {
        console.log(`Server in ascolto sulla porta ${PORT}`);
    });
});
