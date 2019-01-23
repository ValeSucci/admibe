const Alumno = require('../models/alumnos').Alumno;
const AltaMateria = require('../models/alta_materia').AltaMateria;

function getAll(req, res) {
    Alumno.find({}, (error, alumnos) => {
        if (error) {
            res.status(500).send(error)
        } else {
            res.status(200).send(alumnos)
        }
    })
}

function createAlumno(req, res) {
    let b = req.body;
    let bam = req.body.alta_materia[0];

    let plazoC = null;
    let mes = new Date(bam.fecha).getMonth(); //del 0 al 11
    console.log("Mes: " + mes)
    let anio = new Date(bam.fecha).getFullYear();
    if (mes <= 6 && mes !== 0) {
        //alta desde febrero hasta julio 
        if (bam.prorroga) {
            //=> plazo hasta julio del siguiente anio
            plazoC = new Date((anio + 1), 6, 31);

        } else {
            //=> plazo hasta enero del siguiente anio
            plazoC = new Date((anio + 1), 0, 31);
        }
    } else {
        //alta desde agosto hasta enero 
        if (mes === 0) {
            if (bam.prorroga) {
                //=> plazo hasta enero del siguiente anio
                plazoC = new Date(anio + 1, 0, 31);
            } else {
                //=> plazo hasta julio
                plazoC = new Date(anio, 6, 31);
            }
        } else {
            if (bam.prorroga) {
                //=> plazo hasta enero de dos anios despues
                plazoC = new Date(anio + 2, 0, 31);
            } else {
                //=> plazo hasta julio del siguiente anio
                plazoC = new Date(anio + 1, 6, 31);
            }
        }
    }


    let Colores = require('../services/colores');
    let estadoC = "En Elaboración";
    let colorC = Colores.COLOR_ELABORACION;
    if (bam.observaciones !== null && bam.observaciones !== "") {
        colorC = Colores.COLOR_OBSERVADO;
        estadoC = "Observado";
    } else if (bam.defensa_externa.resultado.toLowerCase() === "aprobado") {
        colorC = Colores.COLOR_GRADUADO;
        estadoC = "Graduado";
    } else if (bam.defensa_externa.fecha !== null) {
        colorC = Colores.COLOR_DEFENSA_EXTERNA;
        estadoC = "En Defensa Externa";
    } else if (bam.defensa_interna.resultado.toLowerCase() === "diferido") {
        colorC = Colores.COLOR_DIFERIDA;
        estadoC = "Diferida";
    } else if (bam.defensa_interna.fecha !== null) {
        colorC = Colores.COLOR_DEFENSA_INTERNA;
        estadoC = "En Defensa Interna";
    } else if (bam.revisor.doc !== "") {
        colorC = Colores.COLOR_REVISOR;
        estadoC = "Con Revisor";
    }

    //TODO corregir q esto se ejecute primero!! 
    let citeT = null; //fixCite(true);
    let citeR = null; //fixCite(false);
    console.log("citeT: " + citeT + ", citeR: " + citeR)


    //let tut = buscarDocente(bam.tutor.codigo);
    //let rev = buscarDocente(bam.revisor.codigo);

    //let cartaT = buscarCarta(bam.tutor.tipo_carta);
    //let cartaR = buscarCarta(bam.revisor.tipo_carta);

    var alta_materia = new AltaMateria({
        nro_alta: 1,
        semestre: bam.semestre,
        fecha: bam.fecha,
        plazo: plazoC,
        prorroga: bam.prorroga,
        estado: {
            est: estadoC,
            color: colorC
        },
        modalidad: {
            mod: bam.modalidad.mod,
            trabDirig: {
                empresa: bam.modalidad.trabDirig.empresa,
                fecha_suficiencia: bam.modalidad.trabDirig.fecha_suficiencia
            }
        },
        tema: bam.tema,
        observaciones: bam.observaciones,
        tutor: {
            //doc: tut,
            doc: (bam.tutor.doc !== "") ? bam.tutor.doc : null,
            fecha_asignacion: bam.tutor.fecha_asignacion,
            cite_carta: bam.tutor.fecha_asignacion ? citeT : null,
            // ubicacion_carta: cartaT, //tipo = t en carta -> Tutor
            //ubicacion_carta: bam.tutor._id_carta,
            ubicacion_carta: "5bfc8e0bfaa2061590c0fded",
            fecha_suficiencia: bam.tutor.fecha_suficiencia,
            paga: bam.tutor.fecha_suficiencia ? false : true
        },
        revisor: {
            //doc: rev,
            doc: (bam.revisor.doc !== "") ? bam.revisor.doc : null,
            fecha_asignacion: bam.revisor.fecha_asignacion,
            cite_carta: bam.revisor.fecha_asignacion ? citeR : null,
            //ubicacion_carta: cartaR, //tipo = r en carta -> Revisor
            //ubicacion_carta: bam.revisor._id_carta,
            ubicacion_carta: "5bfc8e0bfaa2061590c0fdee",
            fecha_suficiencia: bam.revisor.fecha_suficiencia,
        },
        defensa_interna: {
            fecha: bam.defensa_interna.fecha,
            resultado: bam.defensa_interna.resultado,
            observacion: bam.defensa_interna.observacion
        },
        defensa_externa: {
            fecha: bam.defensa_externa.fecha,
            presidente: bam.defensa_externa.presidente,
            evaluador1: bam.defensa_externa.evaluador1,
            evaluador2: bam.defensa_externa.evaluador2,
            resultado: bam.defensa_externa.resultado
        }
    })
    alta_materia.save().then(
        (am) => {
            idam = am._id
            var alumno = new Alumno({
                codigo: b.codigo,
                nombre: b.nombre,
                alta_materia: [am]
            })
            alumno.save().then(
                (al) => {
                    res.send(al);
                },
                (error) => {
                    console.log(error)
                    res.send(error);
                }
            )
        }
    )

    //console.log('ida,:'+idam)


    /*
    Alumno.find({codigo:b.codigo}).populate('alta_materia').exec((err, al)=>{
        if(err) return console.log(err)
        console.log(al)
    })*/


}

function getMaxCiteT() {
    Alumno.find({}).sort({ "alta_materia.tutor.cite_carta": -1 }).limit(1).exec((err, alumno) => {
        if (alumno.length === 0) {
            return '1';
        } else {
            if (err) {
                return err;
            } else {
                return alumno.alta_materia.tutor.cite_carta;
            }
        }
    })
}

function getMaxCiteR() {
    Alumno.find({}).sort({ "alta_materia.revisor.cite_carta": -1 }).limit(1).exec((err, alumno) => {
        if (alumno.length === 0) {
            return '1';
        } else {
            if (err) {
                return err;
            } else {
                return alumno.alta_materia.revisor.cite_carta;
            }
        }
    })
}

function fixCite(esTutor) {
    if (esTutor) {
        AltaMateria.find({}).sort({ "tutor.cite_carta": -1 }).limit(1).exec((err, altaMat) => {
            if (err) {
                return err;
            } else {
                if (altaMat.length === 0) {
                    return '1';
                } else {
                    console.log("T:   " + altaMat)

                    let am = altaMat[0];
                    let c = am.tutor.cite_carta;
                    console.log("lastCite: " + c);
                    if (isNaN(c)) {
                        let newC = (parseInt(c.substring(0, c.length - 1)) + 1) + c[c.length - 1]
                        console.log(newC + "")
                        return newC;
                    } else {
                        let newC = parseInt(c) + 1;
                        console.log(newC + "")
                        return newC
                    }
                }
            }
        })
    } else {
        AltaMateria.find({}).sort({ "revisor.cite_carta": -1 }).limit(1).exec((err, altaMat) => {
            if (err) {
                return err;
            } else {
                if (altaMat.length === 0) {
                    return '1';
                } else {
                    console.log("R:   " + altaMat)
                    let am = altaMat[0];
                    let c = am.revisor.cite_carta;
                    console.log("lastCite: " + c);
                    if (isNaN(c)) {
                        return (parseInt(c.substring(0, c.length - 1)) + 1) + c[c.length - 1]
                    } else {
                        return parseInt(c) + 1;
                    }
                }
            }
        })

    }
}


/*function buscarDocente(c) {
    let Docente = require('../models/docentes').Docente;
    Docente.findOne({ codigo: c }, (error, docente) => {
        if (error) {
            res.status(500).send(error)
        } else {
            res.status(200).send(docente._id)
        }
    })
}*/


function buscarCarta(t) {
    let Carta = require('../models/cartas').Carta;
    Carta.findOne({ tipo: t }, (error, carta) => {
        if (error) {
            res.status(500).send(error)
        } else {
            res.status(200).send(carta._id)
        }
    })
}

function get(req, res) {
    Alumno.findOne({ codigo: req.params.codigo }, (error, alumno) => {
        if (error) {
            res.status(500).send(error)
        } else {
            res.status(200).send(alumno)
        }
    })
}


function buscar(req, res) {
    let semestre = "\\b" + req.body.semestre + "\\b";
    let prorroga = req.body.prorroga;
    let estado = "\\b" + req.body.estado + "\\b";
    let modalidad = "\\b" + req.body.modalidad + "\\b";
    let tutor = req.body.tutor;
    let revisor = req.body.revisor;
    if (semestre === "\\btodos\\b") {
        semestre = "";
    }
    if (estado === "\\btodos\\b") {
        estado = "";
    }
    if (modalidad === "\\btodos\\b") {
        modalidad = "";
    }

    AltaMateria.find({ "semestre": { $regex: semestre }, "estado.est": { $regex: estado }, "modalidad.mod": { $regex: modalidad } }, (error, altas) => {

        if (error) {
            //res.status(500).send(error)
            console.log(error)
        } else {
            //res.status(200).send(altas)
            //console.log(altas)
            let aBorrar = []
            for (let k in altas) {
                if ((prorroga.toString() !== "todos" && altas[k].prorroga.toString() !== prorroga.toString())
                    || (tutor.toString() !== "todos" && (altas[k].tutor.doc === null || altas[k].tutor.doc.toString() !== tutor.toString()))
                    || (revisor.toString() !== "todos" && (altas[k].revisor.doc === null || altas[k].revisor.doc.toString() !== revisor.toString()))) {
                    //console.log((prorroga !== "todos" && altas[k].prorroga !== prorroga))
                    //console.log("Con: " + prorroga.toString() + " " + altas[k].prorroga.toString())
                    aBorrar.push(k);
                }
            }
            let borrados = 0;
            for (let k in aBorrar) {
                //console.log("k: " + k + " borr: " + borrados + "   " + altas[k - borrados].prorroga + "  " + altas[k - borrados]._id)

                altas.splice(aBorrar[k] - borrados, 1)
                borrados++;
            }

            if (req.body.alumno !== "todos") {
                Alumno.findOne({ codigo: req.body.alumno }, (error, alumno) => {
                    if (error) {
                        console.log(error)
                    } else {
                        console.log("Alumno: " + alumno)
                        let arrAltas = [];
                        let arrAlum = [];
                        for (let i in altas) {
                            for (let j in alumno.alta_materia) {
                                if (altas[i]._id.toString() === alumno.alta_materia[j].toString()) {
                                    console.log("encontro coincidencias en altas")
                                    arrAltas.push(altas[i]);
                                    arrAlum.push(alumno);
                                    //res.status(200).send({ altas: [altas[i]], alumnos: [alumno] })
                                } else {
                                    console.log("No hay nada u.u")
                                    //res.status(404).send({ mensaje: "No hay coincidencias" })
                                }
                            }
                        }
                        if (arrAltas.length > 0) {
                            res.status(200).send({ altas: arrAltas, alumnos: arrAlum })
                        } else {
                            res.status(404).send({ mensaje: "No hay coincidencias" })
                        }
                    }
                })
            } else {
                let arrAlt = [];
                let arrAlumnos = []
                for (let i in altas) {
                    arrAlt.push(altas[i]._id)
                }
                console.log(arrAlt)
                Alumno.find({ alta_materia: { $in: arrAlt } }, (error, alumnos) => {
                    if (error) {
                        res.status(500).send(error)
                        console.log(error)
                    } else {
                        arrAlumnos = alumnos;
                        //res.status(200).send({ altas: altas, alumnos: alumnos })
                        if (arrAlt.length === alumnos.length) {
                            res.status(200).send({ altas: altas, alumnos: alumnos })
                        } else {
                            for (let i in arrAlt) {
                                if (i < alumnos.length) {
                                    console.log("index: "+i)
                                    console.log(alumnos[i].alta_materia+" -- "+arrAlt[i])
                                    if (!alumnos[i].alta_materia.includes(arrAlt[i])) {
                                        console.log("No contiene")
                                        //buscar a cual pertenece
                                        for (let j in alumnos) {
                                            if (alumnos[j].alta_materia.includes(arrAlt[i])) {
                                                alumnos.splice(i, 0, alumnos[j])
                                                console.log("aniadiendo "+alumno[j].nombre+" a index"+i)
                                                break;
                                            }
                                        }
                                    }
                                } else {
                                    console.log("Copiando el ultimo elemento")
                                    alumnos.push(alumnos[alumnos.length - 1])
                                }
                                //console.log("altas: " + altas + " -- alumnos: " + alumnos)
                            }

                            if (arrAlt.length === alumnos.length) {
                                res.status(200).send({ altas: altas, alumnos: alumnos })
                            }

                        }
                    }
                })

                /*let arrAlumnos = [];
                for (let i in altas) {
                    //arrAlt.push(altas[i]._id)
                    let idAlt = altas[i]._id;
                    console.log("Alta: " + idAlt + " --- " + new Date().getMilliseconds())
                    Alumno.findOne({ alta_materia: idAlt }, (error, alumno) => {
                        if (error) {
                            res.status(500).send(error)
                            console.log(error)
                        } else {
                            console.log("Alumno (antes): " + alumno.nombre + " --- " + new Date().getMilliseconds())
                            arrAlumnos.push(alumno);
                            console.log("Alumno (despues): " + alumno.nombre + " --- " + new Date().getMilliseconds())
                            if (arrAlumnos.length === altas.length) {
                                console.log("Guardando: ")
                                res.status(200).send({ altas: altas, alumnos: arrAlumnos })
                            }
                        }
                    })
                }*/
            }
        }
    })

}


function updateAlumno(req, res) {
    let b = req.body.alumno;
    let bam = req.body.alta[req.body.alta_materia.length - 1];

    let plazoC = null;
    let mes = new Date(bam.fecha).getMonth(); //del 0 al 11
    console.log("Mes: " + mes)
    let anio = new Date(bam.fecha).getFullYear();
    if (mes <= 6 && mes !== 0) {
        //alta desde febrero hasta julio 
        if (bam.prorroga) {
            //=> plazo hasta julio del siguiente anio
            plazoC = new Date((anio + 1), 6, 31);

        } else {
            //=> plazo hasta enero del siguiente anio
            plazoC = new Date((anio + 1), 0, 31);
        }
    } else {
        //alta desde agosto hasta enero 
        if (mes === 0) {
            if (bam.prorroga) {
                //=> plazo hasta enero del siguiente anio
                plazoC = new Date(anio + 1, 0, 31);
            } else {
                //=> plazo hasta julio
                plazoC = new Date(anio, 6, 31);
            }
        } else {
            if (bam.prorroga) {
                //=> plazo hasta enero de dos anios despues
                plazoC = new Date(anio + 2, 0, 31);
            } else {
                //=> plazo hasta julio del siguiente anio
                plazoC = new Date(anio + 1, 6, 31);
            }
        }
    }


    let Colores = require('../services/colores');
    let estadoC = "En Elaboración";
    let colorC = Colores.COLOR_ELABORACION;
    if (bam.observaciones !== null && bam.observaciones !== "") {
        colorC = Colores.COLOR_OBSERVADO;
        estadoC = "Observado";
    } else if (bam.defensa_externa.resultado.toLowerCase() === "aprobado") {
        colorC = Colores.COLOR_GRADUADO;
        estadoC = "Graduado";
    } else if (bam.defensa_externa.fecha !== null) {
        colorC = Colores.COLOR_DEFENSA_EXTERNA;
        estadoC = "En Defensa Externa";
    } else if (bam.defensa_interna.resultado.toLowerCase() === "diferido") {
        colorC = Colores.COLOR_DIFERIDA;
        estadoC = "Diferida";
    } else if (bam.defensa_interna.fecha !== null) {
        colorC = Colores.COLOR_DEFENSA_INTERNA;
        estadoC = "En Defensa Interna";
    } else if (bam.revisor.doc !== "" && bam.revisor.doc !== null) {
        colorC = Colores.COLOR_REVISOR;
        estadoC = "Con Revisor";
    }

    //TODO corregir q esto se ejecute primero!! 
    let citeT = null; //fixCite(true);
    let citeR = null; //fixCite(false);
    console.log("citeT: " + citeT + ", citeR: " + citeR)


    //let tut = buscarDocente(bam.tutor.codigo);
    //let rev = buscarDocente(bam.revisor.codigo);

    //let cartaT = buscarCarta(bam.tutor.tipo_carta);
    //let cartaR = buscarCarta(bam.revisor.tipo_carta);

    console.log(req.body)
    AltaMateria.findOne({ "_id": req.params.id }, (err, alta_materia) => {
        //alta_materia.nro_alta = 1,
        alta_materia.semestre = bam.semestre,
            alta_materia.fecha = bam.fecha,
            alta_materia.plazo = plazoC,
            alta_materia.prorroga = bam.prorroga,
            alta_materia.estado = {
                est: estadoC,
                color: colorC
            },
            alta_materia.modalidad = {
                mod: bam.modalidad.mod,
                trabDirig: {
                    empresa: bam.modalidad.trabDirig.empresa,
                    fecha_suficiencia: bam.modalidad.trabDirig.fecha_suficiencia
                }
            },
            alta_materia.tema = bam.tema,
            alta_materia.observaciones = bam.observaciones,
            alta_materia.tutor = {
                //doc: tut,
                doc: (bam.tutor.doc !== "") ? bam.tutor.doc : null,
                fecha_asignacion: bam.tutor.fecha_asignacion,
                cite_carta: bam.tutor.fecha_asignacion ? citeT : null,
                // ubicacion_carta: cartaT, //tipo = t en carta -> Tutor
                //ubicacion_carta: bam.tutor._id_carta,
                ubicacion_carta: "5bfc8e0bfaa2061590c0fded",
                fecha_suficiencia: bam.tutor.fecha_suficiencia,
                paga: bam.tutor.fecha_suficiencia ? false : true
            },
            alta_materia.revisor = {
                //doc: rev,
                doc: (bam.revisor.doc !== "") ? bam.revisor.doc : null,
                fecha_asignacion: bam.revisor.fecha_asignacion,
                cite_carta: bam.revisor.fecha_asignacion ? citeR : null,
                //ubicacion_carta: cartaR, //tipo = r en carta -> Revisor
                //ubicacion_carta: bam.revisor._id_carta,
                ubicacion_carta: "5bfc8e0bfaa2061590c0fdee",
                fecha_suficiencia: bam.revisor.fecha_suficiencia,
            },
            alta_materia.defensa_interna = {
                fecha: bam.defensa_interna.fecha,
                resultado: bam.defensa_interna.resultado,
                observacion: bam.defensa_interna.observacion
            },
            alta_materia.defensa_externa = {
                fecha: bam.defensa_externa.fecha,
                presidente: bam.defensa_externa.presidente,
                evaluador1: bam.defensa_externa.evaluador1,
                evaluador2: bam.defensa_externa.evaluador2,
                resultado: bam.defensa_externa.resultado
            }
        alta_materia.save((err) => {
            if (err) {
                res.send(err);
            } else {
                Alumno.findOne({ "alta_materia": req.params.id }, (err, alumno) => {
                    alumno.codigo = b.codigo,
                        alumno.nombre = b.nombre
                    //alumno.alta_materia = [am]
                    alumno.save((error) => {
                        if (error) {
                            console.log(error)
                            res.send(error);
                        } else {
                            res.send({ mensaje: "Actualizacion Correcta" })
                        }
                    })
                })
            }
        })
    })
    //console.log('ida,:'+idam)


    /*
    Alumno.find({codigo:b.codigo}).populate('alta_materia').exec((err, al)=>{
        if(err) return console.log(err)
        console.log(al)
    })*/


}


function buscarPorTema(req, res) {

    let t = req.body.tema;
    AltaMateria.find({ "tema": { $regex: t } }, (error, altas) => {

        if (error) {
            //res.status(500).send(error)
            console.log(error)
        } else {
            let arrAlt = [];
            for (let i in altas) {
                arrAlt.push(altas[i]._id)
            }
            console.log(arrAlt)
            Alumno.find({ alta_materia: { $in: arrAlt } }, (error, alumnos) => {
                if (error) {
                    res.status(500).send(error)
                    console.log(error)
                } else {
                    res.status(200).send({ altas: altas, alumnos: alumnos })
                }
            })
        }
    })
}



function nuevaAltaAlumno(req, res) {
    let b = req.body;
    let bam = req.body.alta_materia[req.body.alta_materia.length - 1];

    let plazoC = null;
    let mes = new Date(bam.fecha).getMonth(); //del 0 al 11
    console.log("Mes: " + mes)
    let anio = new Date(bam.fecha).getFullYear();
    if (mes <= 6 && mes !== 0) {
        //alta desde febrero hasta julio 
        if (bam.prorroga) {
            //=> plazo hasta julio del siguiente anio
            plazoC = new Date((anio + 1), 6, 31);

        } else {
            //=> plazo hasta enero del siguiente anio
            plazoC = new Date((anio + 1), 0, 31);
        }
    } else {
        //alta desde agosto hasta enero 
        if (mes === 0) {
            if (bam.prorroga) {
                //=> plazo hasta enero del siguiente anio
                plazoC = new Date(anio + 1, 0, 31);
            } else {
                //=> plazo hasta julio
                plazoC = new Date(anio, 6, 31);
            }
        } else {
            if (bam.prorroga) {
                //=> plazo hasta enero de dos anios despues
                plazoC = new Date(anio + 2, 0, 31);
            } else {
                //=> plazo hasta julio del siguiente anio
                plazoC = new Date(anio + 1, 6, 31);
            }
        }
    }


    let Colores = require('../services/colores');
    let estadoC = "En Elaboración";
    let colorC = Colores.COLOR_ELABORACION;
    if (bam.observaciones !== null && bam.observaciones !== "") {
        colorC = Colores.COLOR_OBSERVADO;
        estadoC = "Observado";
    } else if (bam.defensa_externa.resultado.toLowerCase() === "aprobado") {
        colorC = Colores.COLOR_GRADUADO;
        estadoC = "Graduado";
    } else if (bam.defensa_externa.fecha !== null) {
        colorC = Colores.COLOR_DEFENSA_EXTERNA;
        estadoC = "En Defensa Externa";
    } else if (bam.defensa_interna.resultado.toLowerCase() === "diferido") {
        colorC = Colores.COLOR_DIFERIDA;
        estadoC = "Diferida";
    } else if (bam.defensa_interna.fecha !== null) {
        colorC = Colores.COLOR_DEFENSA_INTERNA;
        estadoC = "En Defensa Interna";
    } else if (bam.revisor.doc !== "") {
        colorC = Colores.COLOR_REVISOR;
        estadoC = "Con Revisor";
    }

    //TODO corregir q esto se ejecute primero!! 
    let citeT = null; //fixCite(true);
    let citeR = null; //fixCite(false);
    console.log("citeT: " + citeT + ", citeR: " + citeR)


    //let tut = buscarDocente(bam.tutor.codigo);
    //let rev = buscarDocente(bam.revisor.codigo);

    //let cartaT = buscarCarta(bam.tutor.tipo_carta);
    //let cartaR = buscarCarta(bam.revisor.tipo_carta);

    var alta_materia = new AltaMateria({
        nro_alta: bam.nro_alta,
        semestre: bam.semestre,
        fecha: bam.fecha,
        plazo: plazoC,
        prorroga: bam.prorroga,
        estado: {
            est: estadoC,
            color: colorC
        },
        modalidad: {
            mod: bam.modalidad.mod,
            trabDirig: {
                empresa: bam.modalidad.trabDirig.empresa,
                fecha_suficiencia: bam.modalidad.trabDirig.fecha_suficiencia
            }
        },
        tema: bam.tema,
        observaciones: bam.observaciones,
        tutor: {
            //doc: tut,
            doc: (bam.tutor.doc !== "") ? bam.tutor.doc : null,
            fecha_asignacion: bam.tutor.fecha_asignacion,
            cite_carta: bam.tutor.fecha_asignacion ? citeT : null,
            // ubicacion_carta: cartaT, //tipo = t en carta -> Tutor
            //ubicacion_carta: bam.tutor._id_carta,
            ubicacion_carta: "5bfc8e0bfaa2061590c0fded",
            fecha_suficiencia: bam.tutor.fecha_suficiencia,
            paga: bam.tutor.fecha_suficiencia ? false : true
        },
        revisor: {
            //doc: rev,
            doc: (bam.revisor.doc !== "") ? bam.revisor.doc : null,
            fecha_asignacion: bam.revisor.fecha_asignacion,
            cite_carta: bam.revisor.fecha_asignacion ? citeR : null,
            //ubicacion_carta: cartaR, //tipo = r en carta -> Revisor
            //ubicacion_carta: bam.revisor._id_carta,
            ubicacion_carta: "5bfc8e0bfaa2061590c0fdee",
            fecha_suficiencia: bam.revisor.fecha_suficiencia,
        },
        defensa_interna: {
            fecha: bam.defensa_interna.fecha,
            resultado: bam.defensa_interna.resultado,
            observacion: bam.defensa_interna.observacion
        },
        defensa_externa: {
            fecha: bam.defensa_externa.fecha,
            presidente: bam.defensa_externa.presidente,
            evaluador1: bam.defensa_externa.evaluador1,
            evaluador2: bam.defensa_externa.evaluador2,
            resultado: bam.defensa_externa.resultado
        }
    })
    alta_materia.save().then(
        (am) => {
            idam = am._id
            Alumno.findOne({ "codigo": req.params.codigo }, (err, alumno) => {
                alumno.codigo = b.codigo,
                    alumno.nombre = b.nombre,
                    alumno.alta_materia.push(am)
                alumno.save((error) => {
                    if (error) {
                        console.log(error)
                        res.send(error);
                    } else {
                        res.send({ mensaje: "Nueva Alta Aniadida" })
                    }
                })
            })
        }
    )

    //console.log('ida,:'+idam)


    /*
    Alumno.find({codigo:b.codigo}).populate('alta_materia').exec((err, al)=>{
        if(err) return console.log(err)
        console.log(al)
    })*/


}




module.exports = { getAll, createAlumno, get, buscar, updateAlumno, buscarPorTema, nuevaAltaAlumno }