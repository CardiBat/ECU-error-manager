import React, { useState, useEffect } from 'react';
import {
    CssBaseline,
    Container,
    TextField,
    Button,
    Typography,
    Alert,
    Card,
    Grid,
    Select,
    MenuItem,
    Tabs,
    Tab,
    CircularProgress
} from '@mui/material';
import DOMPurify from 'dompurify';  // Importa DOMPurify per la sanitizzazione

function App() {
    // Stato per il tipo di ricerca: 'original', 'spn-fmi', 'codice-sdf'
    const [searchType, setSearchType] = useState('original');

    // Stati comuni
    const [modello, setModello] = useState('');
    const [dati, setDati] = useState([]);
    const [errore, setErrore] = useState('');

    // Stati per la Ricerca Originale
    const [ecu, setEcu] = useState('');
    const [ecuOptions, setEcuOptions] = useState([]);
    const [isLoadingEcu, setIsLoadingEcu] = useState(false);

    // Stati per la Ricerca Originale e SPN/FMI
    const [spn, setSpn] = useState('');

    // Stato per la Ricerca SPN/FMI
    const [fmi, setFmi] = useState('');

    // Stato per la Ricerca Codice SDF
    const [codiceSDF, setCodiceSDF] = useState('');

    // Stati di caricamento
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);

    // Lista dei modelli
    const modelliList = [
        '3', '3E', '4E', '5', '5D', '5DF', '5DF-ECOLINE', '5DF-KEYLINE',
        '5DF-TTV', '5D-KEYLINE', '5DS', '5DS-ECOLINE', '5DS-TTV',
        '5D-TTV', '5DV-ECOLINE', '5DV-TTV', '5E', '5K', '5TB',
        '6', '6C', '6C-RVSHIFT', '6C-TTV', '6-RVSHIFT', '6-TTV',
        '7-TTV', '8-TTV', '9-TTV'
    ];

    // Funzione per recuperare le ECU basate sul modello selezionato (solo per Ricerca Originale)
    const fetchEcuOptions = async (selectedModello) => {
        setIsLoadingEcu(true);
        setEcu('');
        setEcuOptions([]);
        setDati([]);
        setErrore('');

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/centraline?modello=${encodeURIComponent(selectedModello)}`);
            const data = await response.json();

            if (response.ok) {
                setEcuOptions(data);
            } else {
                setErrore(data.error || 'Errore nel recupero delle ECU.');
            }
        } catch (error) {
            console.error('Errore nella comunicazione con il server:', error);
            setErrore('Errore nella comunicazione con il server.');
        } finally {
            setIsLoadingEcu(false);
        }
    };

    // Effettua la chiamata per le ECU quando il modello cambia, solo per Ricerca Originale
    useEffect(() => {
        if (searchType === 'original' && modello) {
            fetchEcuOptions(modello);
        } else {
            setEcuOptions([]);
            setEcu('');
        }
    }, [modello, searchType]);

    // Funzione per la gestione del submit del form di ricerca
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Sanitizzazione degli input
        const sanitizedModello = DOMPurify.sanitize(modello);
        const sanitizedEcu = DOMPurify.sanitize(ecu);
        const sanitizedSpn = DOMPurify.sanitize(spn);
        const sanitizedFmi = DOMPurify.sanitize(fmi);
        const sanitizedCodiceSDF = DOMPurify.sanitize(codiceSDF);

        // Costruzione dei parametri di ricerca in base al searchType
        let queryParams = {};

        if (searchType === 'original') {
            // Ricerca Originale: modello, ECU, SPN
            if (!sanitizedModello || !sanitizedEcu || !sanitizedSpn) {
                setErrore('Tutti i campi sono obbligatori.');
                setDati([]);
                return;
            }

            if (isNaN(sanitizedSpn)) {
                setErrore('SPN deve essere un numero valido.');
                setDati([]);
                return;
            }

            queryParams = {
                modello: sanitizedModello,
                ECU: sanitizedEcu,
                spn: sanitizedSpn
            };

            const queryString = Object.entries(queryParams)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&');

            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/search/original?${queryString}`);
                const data = await response.json();

                if (response.ok) {
                    setDati(data);
                } else {
                    setErrore(data.error || 'Errore nella ricerca.');
                }
            } catch (error) {
                console.error('Errore nella comunicazione con il server:', error);
                setErrore('Errore nella comunicazione con il server.');
            }
        } else if (searchType === 'spn-fmi') {
            // Ricerca SPN/FMI: modello (optional), SPN, FMI
            if (!sanitizedSpn || !sanitizedFmi) {
                setErrore('SPN e FMI sono obbligatori.');
                setDati([]);
                return;
            }

            if (isNaN(sanitizedSpn)) {
                setErrore('SPN deve essere un numero valido.');
                setDati([]);
                return;
            }

            queryParams = {
                spn: sanitizedSpn,
                fmi: sanitizedFmi
            };

            if (sanitizedModello) {
                queryParams.modello = sanitizedModello;
            }

            const queryString = Object.entries(queryParams)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&');

            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/search/spn-fmi?${queryString}`);
                const data = await response.json();

                if (response.ok) {
                    setDati(data);
                } else {
                    setErrore(data.error || 'Errore nella ricerca.');
                }
            } catch (error) {
                console.error('Errore nella comunicazione con il server:', error);
                setErrore('Errore nella comunicazione con il server.');
            }
        } else if (searchType === 'codice-sdf') {
            // Ricerca Codice SDF: modello, codiceSDF
            if (!sanitizedModello || !sanitizedCodiceSDF) {
                setErrore('Modello e Codice SDF sono obbligatori.');
                setDati([]);
                return;
            }

            queryParams = {
                modello: sanitizedModello,
                'codice-sdf': sanitizedCodiceSDF
            };

            const queryString = Object.entries(queryParams)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&');

            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/search/codice-sdf?${queryString}`);
                const data = await response.json();

                if (response.ok) {
                    setDati(data);
                } else {
                    setErrore(data.error || 'Errore nella ricerca.');
                }
            } catch (error) {
                console.error('Errore nella comunicazione con il server:', error);
                setErrore('Errore nella comunicazione con il server.');
            }
        }

        setIsLoadingSearch(false);
    };

    // Funzione per rendere le card dei risultati
    const renderCard = (item, key) => {
        const ecuDisplay = item.ECU && item.ECU !== 'N/A' ? item.ECU : 'NON PRESENTE';
        const codiceSDFVal = item['Codice SDF'] && item['Codice SDF'] !== 'N/A' ? item['Codice SDF'] : 'NON PRESENTE';

        return (
            <Grid item xs={12} key={key}>
                <Card
                    variant="outlined"
                    sx={{ p: 3, borderRadius: 2, boxShadow: 3, backgroundColor: '#ffffff', borderColor: '#3f51b5' }}
                >
                    <Typography variant="h5" component="h3" align="center" color="#3f51b5" gutterBottom>
                        {ecuDisplay}
                    </Typography>
                    <Typography variant="body1" color="#3f51b5" fontWeight="bold" gutterBottom>
                        Codice SDF: {codiceSDFVal}
                    </Typography>
                    <Typography variant="body1">
                        {item.Descrizione || 'Descrizione non disponibile'}
                    </Typography>
                </Card>
            </Grid>
        );
    };

    return (
        <React.Fragment>
            <CssBaseline />
            <Container maxWidth="md">
                <Typography
                    variant="h2"
                    component="h1"
                    align="center"
                    gutterBottom
                    sx={{
                        color: '#3f51b5',
                        mt: 4,
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }  // Regola le dimensioni del testo sui dispositivi più piccoli
                    }}
                >
                    ECU Helper
                </Typography>

                {/* Menu di selezione del tipo di ricerca */}
                <Tabs
                    value={searchType}
                    onChange={(event, newValue) => {
                        setSearchType(newValue);
                        setModello('');
                        setEcu('');
                        setSpn('');
                        setFmi('');
                        setCodiceSDF('');
                        setDati([]);
                        setErrore('');
                    }}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"  // Aggiungi questa riga per abilitare lo scorrimento orizzontale
                    scrollButtons="auto"  // Aggiungi questa riga per mostrare i pulsanti di scorrimento automaticamente
                    allowScrollButtonsMobile  // Abilita i pulsanti di scorrimento su mobile
                    sx={{ mb: 3 }}
                >
                    <Tab label="Ricerca Originale" value="original" />
                    <Tab label="Ricerca SPN/FMI" value="spn-fmi" />
                    <Tab label="Ricerca Codice SDF" value="codice-sdf" />
                </Tabs>

                <form onSubmit={handleSubmit}>
                    {/* Dropdown Modello */}
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={4}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#3f51b5' }}>
                                Modello
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={8}>
                            <Select
                                fullWidth
                                displayEmpty
                                value={modello}
                                onChange={(e) => setModello(e.target.value)}
                                required={searchType !== 'spn-fmi'}
                                renderValue={(selected) => selected || 'Seleziona Modello'}
                            >
                                {modelliList.map((mod, index) => (
                                    <MenuItem key={index} value={mod}>{mod}</MenuItem>
                                ))}
                            </Select>
                        </Grid>
                    </Grid>

                    {/* Dropdown ECU - solo per Ricerca Originale */}
                    {searchType === 'original' && modello && (
                        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                            <Grid item xs={4}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#3f51b5' }}>
                                    ECU
                                </Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Select
                                    fullWidth
                                    displayEmpty
                                    value={ecu}
                                    onChange={(e) => setEcu(e.target.value)}
                                    required
                                    disabled={isLoadingEcu || ecuOptions.length === 0}
                                    renderValue={(selected) => selected || (isLoadingEcu ? 'Caricamento...' : 'Seleziona ECU')}
                                >
                                    {ecuOptions.map((ecuItem, index) => (
                                        <MenuItem key={index} value={ecuItem}>{ecuItem}</MenuItem>
                                    ))}
                                </Select>
                            </Grid>
                        </Grid>
                    )}

                    {/* Input SPN o Codice SDF */}
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Grid item xs={4}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#3f51b5' }}>
                                {searchType === 'codice-sdf' ? 'Codice SDF' : 'SPN'}
                            </Typography>
                        </Grid>
                        <Grid item xs={8}>
                            {searchType === 'codice-sdf' ? (
                                <TextField
                                    fullWidth
                                    placeholder="Codice SDF"
                                    value={codiceSDF}
                                    onChange={(e) => setCodiceSDF(e.target.value.toUpperCase())} // Converte in maiuscolo
                                    required
                                />
                            ) : (
                                <TextField
                                    fullWidth
                                    type="number"
                                    placeholder="SPN"
                                    value={spn}
                                    onChange={(e) => setSpn(e.target.value.replace(/\D/g, ''))} // Rimuove caratteri non numerici
                                    required={searchType !== 'spn-fmi'} // Obbligatorio per Ricerca Originale e SPN/FMI
                                />
                            )}
                        </Grid>
                    </Grid>

                    {/* Input FMI - solo per Ricerca SPN/FMI */}
                    {searchType === 'spn-fmi' && (
                        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                            <Grid item xs={4}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#3f51b5' }}>
                                    FMI
                                </Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    placeholder="FMI"
                                    value={fmi}
                                    onChange={(e) => setFmi(e.target.value.replace(/\D/g, ''))} // Rimuove caratteri non numerici
                                    required
                                />
                            </Grid>
                        </Grid>
                    )}

                    {/* Bottone Cerca */}
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={
                            (searchType === 'original' && (!modello || !ecu || !spn)) ||
                            (searchType === 'spn-fmi' && (!spn || !fmi)) ||
                            (searchType === 'codice-sdf' && (!modello || !codiceSDF)) ||
                            isLoadingSearch
                        }
                        sx={{ mt: 3 }}
                    >
                        {isLoadingSearch ? <CircularProgress size={24} color="inherit" /> : 'Cerca'}
                    </Button>
                </form>

                {/* Risultati della ricerca */}
                {dati.length > 0 && (
                    <Grid container spacing={2} sx={{ mt: 4 }}>
                        {dati.map((item, index) => renderCard(item, index))}
                    </Grid>
                )}

                {/* Messaggi di errore */}
                {errore && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {errore}
                    </Alert>
                )}
            </Container>
        </React.Fragment>
    );
}

export default App;
