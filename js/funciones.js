const quizResuelto = {}
const respuestasUsuario = {}

function iniciarEventos() {
    var canvas = document.getElementById('canvas');
    var video = document.getElementById('video');

    //Evento para actualizar la barra de progreso
    video.addEventListener("timeupdate", barraProgreso, true);
    //Evento para actualizar el canvas
    canvas.addEventListener("click", function (e) {
        var video = document.getElementById('video');
        var canvas = document.getElementById('canvas');
        if (!e) {
            e = window.event;
        } //get the latest windows event if it isn't set
        try {
            //calculate the current time based on position of mouse cursor in canvas box
            video.currentTime = video.duration * (e.offsetX / canvas.clientWidth);

        }
        catch (err) {
            // Fail silently but show in F12 developer tools console
            if (window.console && console.error("Error:" + err));
        }
    }, true);
}

function play() {
    var video = document.getElementById("video");
    var icono_play = document.getElementById("play");
    if (video.paused) {
        video.play();
        icono_play.setAttribute("class", "glyphicon glyphicon-pause");
    } else {
        video.pause();
        icono_play.setAttribute("class", "glyphicon glyphicon-play");
    }
}


function stop() {
    var video = document.getElementById("video");
    var icono_play = document.getElementById("play");
    video.currentTime = 0;
    video.pause();
    icono_play.setAttribute("class", "glyphicon glyphicon-play");
}

function forward(value) {
    var video = document.getElementById("video");
    video.currentTime += value;
}

function backward(value) {
    var video = document.getElementById("video");
    video.currentTime -= value;
}

function barraProgreso() {
    var video = document.getElementById('video');
    //Get tiempo actual
    var tiempoActual = Math.round(video.currentTime);
    // Actalizar time eclapsed
    var minutos = Math.floor(tiempoActual / 60);
    if (minutos < 60) {
        minutos = "0" + minutos;
    }
    var segundos = tiempoActual % 60;
    if (segundos < 10) {
        segundos = "0" + segundos;
    }
    var ct = document.getElementById('currentTime');
    var aux = minutos + ':' + segundos;
    ct.innerHTML = aux;

    //Actualizamos la barra de progreso
    if (canvas.getContext) {

        var ctx = canvas.getContext("2d");
        //clear canvas before painting
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        ctx.fillStyle = "gold";
        var fWidth = (tiempoActual / video.duration) * (canvas.clientWidth);
        if (fWidth > 0) {
            ctx.fillRect(0, 0, fWidth, canvas.clientHeight);
        }

    }

    var progreso = video.currentTime / video.duration

    const ruta = document.getElementById("camino")

    const total = ruta.getTotalLength()

    ruta.style.strokeDashoffset = total - (total * progreso)
}
function fullScreen() {
    var video = document.getElementById('video');
    if (video.requestFullScreen) {
        video.requestFullScreen();
    } else if (video.webkitRequestFullScreen) {
        video.webkitRequestFullScreen();
    } else if (video.mozRequestFullScreen) {
        video.mozRequestFullScreen();
    }
}
window.addEventListener("DOMContentLoaded", iniciarEventos, false);

//Listener para Text Track
document.addEventListener("DOMContentLoaded", function () {  // don't run this until all DOM content is loaded 
    var track = document.getElementById("track");
    track.addEventListener("cuechange", function () {
        var myTrack = this.track;             // track element is "this" 
        var myCues = myTrack.activeCues;      // activeCues is an array of current cues.                                                    
        if (myCues.length > 0) {
            var json = JSON.parse(myCues[0].text);
            var nombre = document.getElementById("nombre");
            nombre.innerHTML = json.nombre;
            var descripcion = document.getElementById("descripcion");
            descripcion.innerHTML = json.descripcion;
            var img = document.getElementById("img");
            img.setAttribute("src", json.img);
        }
    }, false);
}, false);

function setTime(tValue, zona) {
    const video = document.getElementById('video');

    function aplicarTiempo() {
        video.removeEventListener('canplaythrough', aplicarTiempo);
        video.currentTime = tValue;
        if (zona) {
            moverZona(zona);
            actualizarRuta(zona);
            marcarZonaActiva(zona); // <-- resaltamos también aquí
        }
    }

    if (video.readyState >= 4) { // HAVE_ENOUGH_DATA
        aplicarTiempo();
    } else {
        video.addEventListener('canplaythrough', aplicarTiempo);
    }
}

async function detectarMapa() {

    const mapa = document.getElementById("mapa")

    const res = await fetch("http://localhost:5000/detect", {
        method: "POST",
        body: await (await fetch(mapa.src)).blob()
    })

    const data = await res.json()

    moverMarcador(data)

}
function moverMarcador(detections) {

    const marker = document.getElementById("marker")

    detections.forEach(d => {

        if (d.label === "rivendell") {
            marker.style.left = d.x + "px"
            marker.style.top = d.y + "px"
        }

        if (d.label === "erebor") {
            marker.style.left = d.x + "px"
            marker.style.top = d.y + "px"
        }

    })

}
function moverZona(zona) {

    const marker = document.getElementById("marker")

    const posiciones = {
        comarca: { x: 220, y: 180 },
        rivendell: { x: 330, y: 170 },
        montanas: { x: 340, y: 160 },
        bosque: { x: 395, y: 150 },
        lago: { x: 415, y: 150 },
        erebor: { x: 415, y: 135 }
    }
    console.log("posiciones", posiciones)
    marker.style.left = posiciones[zona].x + "px"
    marker.style.top = posiciones[zona].y + "px"

}
window.onload = () => {
    moverZona("comarca")
    iniciarRuta()
    actualizarRuta("comarca")

    const icono_play = document.getElementById("play");
    const video = document.getElementById("video");
    // ajusta el icono según si está reproduciéndose
    icono_play.setAttribute("class", video.paused ? "glyphicon glyphicon-play" : "glyphicon glyphicon-pause");
}

function iniciarRuta() {
    const ruta = document.getElementById("camino");
    const total = ruta.getTotalLength();

    ruta.style.strokeDasharray = total; // longitud total para animación
    ruta.style.strokeDashoffset = total; // empieza invisible
}
const progresoZona = {
    comarca: 0,
    rivendell: 0.2,
    montanas: 0.4,
    bosque: 0.6,
    lago: 0.8,
    erebor: 1
}

function actualizarRuta(zona) {

    const ruta = document.getElementById("camino")
    const total = ruta.getTotalLength()

    const progreso = progresoZona[zona]

    ruta.style.strokeDashoffset = total - (total * progreso)

}

function toggleSubs() {

    const video = document.getElementById("video");
    const track = video.textTracks[0];

    if (track.mode === "showing") {
        track.mode = "hidden";
    } else {
        track.mode = "showing";
    }
}

function changeQuality(level) {
    const hls = window.hlsInstance; // guarda tu instancia Hls al crearla
    if (level === 'high') hls.currentLevel = 0;    // primer nivel
    if (level === 'medium') hls.currentLevel = 1;  // segundo nivel
    if (level === 'low') hls.currentLevel = 2;     // tercer nivel
}

function toggleSettings() {
    const menu = document.getElementById("settingsMenu");

    if (menu.style.display === "block") {
        menu.style.display = "none";
    } else {
        menu.style.display = "block";
    }
}

function changeSpeed(speed) {

    const video = document.getElementById("video");

    video.playbackRate = speed;
}

document.addEventListener("click", function (e) {

    const menu = document.getElementById("settingsMenu");
    const btn = document.getElementById("settingsBtn");

    if (!menu.contains(e.target) && e.target !== btn) {
        menu.style.display = "none";
    }

});

document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video");
  if (video.textTracks.length > 0) {
    video.textTracks[0].mode = "showing";
  }
});

const zonasVideo = [
    { zona: "comarca", inicio: 0, fin: 99 },
    { zona: "rivendell", inicio: 99, fin: 147 },
    { zona: "montanas", inicio: 147, fin: 187 },
    { zona: "bosque", inicio: 187, fin: 243 },
    { zona: "lago", inicio: 243, fin: 266 },
    { zona: "erebor", inicio: 266, fin: 298 } // ajustar según duración real
];

const video = document.getElementById("video");

let zonaAnterior = null; // para no actualizar la misma zona repetidamente
let quizMostrado = null

video.addEventListener("timeupdate", () => {

    const tiempo = video.currentTime

    const zonaActual = zonasVideo.find(z => tiempo >= z.inicio && tiempo < z.fin)

    if (zonaActual && zonaActual.zona !== zonaAnterior) {

        zonaAnterior = zonaActual.zona

        moverZona(zonaActual.zona)
        actualizarRuta(zonaActual.zona)
        actualizarDetalleZona(zonaActual.zona);
        marcarZonaActiva(zonaActual.zona)

    }

    zonasVideo.forEach(z => {

        if (tiempo >= z.fin && !quizResuelto[z.zona]) {

            video.pause()

            mostrarQuiz(z.zona)

        }

    })

})

function marcarZonaActiva(zona) {
    const items = document.querySelectorAll('.table-of-contents .list-group-item');
    items.forEach(item => {
        // El atributo onclick contiene el nombre de la zona
        const onClickAttr = item.getAttribute('onclick') || '';
        if (onClickAttr.includes(`'${zona}'`)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

const quizZonas = {
    comarca: [
        { pregunta: "¿Dónde vive Bilbo al inicio de la historia?", opciones: ["La Comarca", "Rivendel", "Erebor"], correcta: 0 },
        { pregunta: "¿Quién visita a Bilbo para invitarlo a la aventura?", opciones: ["Gandalf", "Thorin", "Balin"], correcta: 0 },
        { pregunta: "¿Cuál es el hobbit más viejo de la Comarca que aparece en la historia?", opciones: ["Bilbo", "Frodo", "Bungo"], correcta: 0 },
        { pregunta: "¿Qué objeto encuentra Bilbo que lo hace invisible?", opciones: ["El Anillo", "El Mithril", "La espada Dardo"], correcta: 0 }
    ],
    rivendell: [
        { pregunta: "¿Quién gobierna Rivendel?", opciones: ["Elrond", "Thorin", "Saruman"], correcta: 0 },
        { pregunta: "¿Qué evento importante se celebra en Rivendel?", opciones: ["Concilio de Elrond", "Coronación de Thorin", "Fiesta de cumpleaños de Bilbo"], correcta: 0 },
        { pregunta: "¿Qué elfos ayudan a la compañía a recuperarse y prepararse?", opciones: ["Los elfos de Rivendel", "Los elfos del Bosque Negro", "Los elfos de Lothlórien"], correcta: 0 },
        { pregunta: "¿Qué sabio consejo recibe Bilbo en Rivendel?", opciones: ["'Toma la decisión correcta'", "'Nunca te separes del grupo'", "'Usa el anillo con prudencia'"], correcta: 2 }
    ],
    montanas: [
        { pregunta: "¿Qué criaturas atacan en las montañas?", opciones: ["Orcos", "Elfos", "Ents"], correcta: 0 },
        { pregunta: "¿Cómo se llama la compañía que viaja por las montañas?", opciones: ["La Compañía de Thorin", "Los Hobbits Aventureros", "Los Guardianes de Erebor"], correcta: 0 },
        { pregunta: "¿Qué obstáculo natural deben superar en las montañas?", opciones: ["Tormenta de nieve", "Río caudaloso", "Pantano venenoso"], correcta: 0 }
    ],
    bosque: [
        { pregunta: "¿Cómo se llama el bosque oscuro?", opciones: ["Bosque Negro", "Fangorn", "Lothlorien"], correcta: 0 },
        { pregunta: "¿Qué rey de los elfos gobierna en el Bosque Negro?", opciones: ["Thranduil", "Elrond", "Legolas"], correcta: 0 },
        { pregunta: "¿Qué le ocurre a la compañía al entrar en el bosque?", opciones: ["Son capturados por los elfos", "Son atacados por trolls", "Encuentran un tesoro escondido"], correcta: 0 }
    ],
    lago: [
        { pregunta: "¿Cómo se llama la ciudad del lago?", opciones: ["Esgaroth", "Minas Tirith", "Bree"], correcta: 0 },
        { pregunta: "¿Quién gobierna Esgaroth?", opciones: ["Bard el Arquero", "Thorin", "Smaug"], correcta: 0 },
        { pregunta: "¿Qué evento amenaza la ciudad del lago?", opciones: ["Ataque de Smaug", "Inundación", "Plaga de ratas"], correcta: 0 }
    ],
    erebor: [
        { pregunta: "¿Quién es el dragón de Erebor?", opciones: ["Smaug", "Glaurung", "Ancalagon"], correcta: 0 },
        { pregunta: "¿Qué tesoro custodia Smaug?", opciones: ["Oro y joyas", "El Anillo Único", "Armas mágicas"], correcta: 0 },
        { pregunta: "¿Quién lidera la expedición para recuperar Erebor?", opciones: ["Thorin", "Balin", "Gandalf"], correcta: 0 },
        { pregunta: "¿Qué prueba enfrenta Bilbo dentro de la montaña?", opciones: ["Encontrar a Smaug y escapar sin ser visto", "Derrotar a los orcos", "Robar un objeto mágico"], correcta: 0 }
    ]
};

function mostrarQuiz(zona) {
    const preguntas = quizZonas[zona];
    if (!preguntas) return;

    // Seleccionamos aleatoriamente una pregunta
    const quiz = preguntas[Math.floor(Math.random() * preguntas.length)];

    const container = document.getElementById("quizContainer");
    const pregunta = document.getElementById("quizPregunta");
    const opciones = document.getElementById("quizOpciones");
    const mensaje = document.getElementById("quizMensaje");

    pregunta.innerText = quiz.pregunta;
    opciones.innerHTML = "";
    mensaje.innerText = "";

    // Mezclar opciones
    const shuffledOpciones = quiz.opciones
        .map((op, i) => ({ op, i }))  // guardar índice original
        .sort(() => Math.random() - 0.5);

    shuffledOpciones.forEach((item, i) => {
        const btn = document.createElement("button");
        btn.innerText = item.op;
        btn.style.color = "white";
        btn.style.fontWeight = "bold";
        btn.style.border = "2px solid gold";
        btn.style.background = "transparent";
        btn.style.padding = "10px";
        btn.style.margin = "6px 0";
        btn.style.cursor = "pointer";
        btn.style.borderRadius = "6px";
        btn.style.width = "100%";

        btn.onmouseenter = () => btn.style.background = "rgba(255,215,0,0.15)";
        btn.onmouseleave = () => btn.style.background = "transparent";

        btn.onclick = () => {
            const esCorrecta = item.i === quiz.correcta;

            respuestasUsuario[zona] = {
                pregunta: quiz.pregunta,
                respuestaUsuario: item.op,
                respuestaCorrecta: quiz.opciones[quiz.correcta],
                correcta: esCorrecta
            };
            quizResuelto[zona] = true;
            container.style.display = "none";
            video.play();
        };

        opciones.appendChild(btn);
    });

    container.style.display = "block";
}

video.addEventListener("ended", mostrarResumen)

function mostrarResumen() {

    const panel = document.getElementById("resumenFinal")
    const resultado = document.getElementById("resultadoViaje")
    const detalle = document.getElementById("detallePreguntas")

    detalle.innerHTML = ""

    let aciertos = 0
    const total = Object.keys(respuestasUsuario).length

    Object.keys(respuestasUsuario).forEach(zona => {

        const r = respuestasUsuario[zona]

        if (r.correcta) aciertos++

        const bloque = document.createElement("div")

        bloque.style.marginBottom = "10px"
        bloque.style.padding = "5px"
        bloque.style.borderBottom = "1px solid #6e5a2c"

        bloque.innerHTML = `
        <b>${zona.toUpperCase()}</b><br>
        ${r.pregunta}<br>
        Tu respuesta: ${r.respuestaUsuario}<br>
        Correcta: ${r.respuestaCorrecta}<br>
        ${r.correcta ? "✔ Correcto" : "❌ Incorrecto"}
        `

        detalle.appendChild(bloque)

    })

    resultado.innerHTML = `
        Has acertado <b>${aciertos}</b> de <b>${total}</b> preguntas
        `

    panel.style.display = "block"

}

function reiniciarViaje() {

    video.currentTime = 0
    video.play()

    document.getElementById("resumenFinal").style.display = "none"

    Object.keys(quizResuelto).forEach(k => delete quizResuelto[k])
    Object.keys(respuestasUsuario).forEach(k => delete respuestasUsuario[k])

}

function cerrarSettings() {
    document.getElementById("settingsMenu").style.display = "none"
}

function mostrarLoader() {
    document.getElementById("videoLoader").style.display = "block"
}

function ocultarLoader() {
    document.getElementById("videoLoader").style.display = "none"
}

function accionSettings(callback) {
    cerrarSettings();
    mostrarLoader();

    const resultado = callback(); // ejecuta la acción

    // Si callback devuelve una promesa (como una carga de video), espera
    if (resultado instanceof Promise) {
        resultado.finally(() => ocultarLoader());
    } else {
        // si es síncrono, solo esperamos 2 segundos
        setTimeout(() => {
            ocultarLoader();
        }, 2000);
    }
}

function actualizarDetalleZona(zona) {
    const infoZonas = {
        comarca: { nombre: "La Comarca", descripcion: "Hogar de Bilbo y los hobbits, tranquilo y verde.", img: "img/comarca.jpg" },
        rivendell: { nombre: "Rivendel", descripcion: "Valle élfico gobernado por Elrond, lugar de descanso y consejo.", img: "img/rivendell.jpg" },
        montanas: { nombre: "Montañas Nubladas", descripcion: "Terreno peligroso, hogar de trolls y orcos.", img: "img/montanas.jpg" },
        bosque: { nombre: "Bosque Negro", descripcion: "Bosque oscuro y tenebroso, con elfos hostiles.", img: "img/bosque.jpg" },
        lago: { nombre: "Ciudad del Lago", descripcion: "Ciudad a orillas del lago, gobernada por Bard.", img: "img/lago.jpg" },
        erebor: { nombre: "Erebor", descripcion: "Montaña solitaria, hogar del tesoro custodiado por Smaug.", img: "img/erebor.jpg" }
    };

    if(infoZonas[zona]) {
        document.getElementById("nombreZona").innerText = infoZonas[zona].nombre;
        document.getElementById("descripcionZona").innerText = infoZonas[zona].descripcion;
        document.getElementById("imgZona").src = infoZonas[zona].img;
    }
}

const img = document.getElementById("imgZona");
img.style.opacity = 0;
setTimeout(() => {
    img.src = infoZonas[zona].img;
    img.style.opacity = 1;
}, 200);