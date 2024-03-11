const cron = require('node-cron');
const { getAllJobs,getJobsByUrlTalla,updateExisteStock } = require('../models/peticiones.model');

const { Builder, By, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { Options } = require('selenium-webdriver/chrome');

/**
 * Método programado que verifica la disponibilidad de productos en las URL almacenadas en la base de datos.
 * - Recupera las peticiones almacenadas en la base de datos.
 * - Para cada petición, busca la disponibilidad de la talla del producto en la URL correspondiente.
 * - Si encuentra el producto y la talla está disponible, envía un correo electrónico al usuario y actualiza la base de datos.
 * - Si no hay peticiones o si ocurre algún error, se registra en la consola.
 */
cron.schedule('*/1 * * * *', async () => {
    console.log('pasando');
    try {
        //Consultamos si hay peticiones a buscar agrupando entre ellas para optimizar resultados
        const [peticiones] = await getAllJobs();
        if (!peticiones || peticiones.length == 0) {
            console.log('No hay peticiones actualmente');
            return;
        }
        
        //Si hay peticiones, iterar sobre ellas y buscar si existe la talla en la url solicitada
        const arrayResultados = [];
        for (let peticion of peticiones) {
            const resultadoPeticion = await verificarDisponibilidad(peticion);
            if (resultadoPeticion!= null) {
                let resultadoToArray = {peticion: peticion,resultadoPeticion: resultadoPeticion};
                arrayResultados.push(resultadoToArray)
            }
        }
        
        //Recorremos los resultados y los actualizamos y enviamos si es necesario
        if (arrayResultados.length > 0) {
            for (let itemResultados of arrayResultados) {
                enviarActualizarPeticionUsuarios(itemResultados.peticion, itemResultados.resultadoPeticion);
            }
        }
        
    } catch (error) {
        console.error('Error al ejecutar la tarea programada:', error);
    }
});


/**
* Función para verificar la disponibilidad de una talla en una URL específica.
* @param {Object} peticion - Objeto que contiene la información de la petición, incluyendo el ID, talla y URL.
* @returns {Object|null} - Objeto con el ID, talla, URL y mensaje de disponibilidad, o null si la talla no está disponible.
*/
const verificarDisponibilidad = async (peticion) => {
   const resultados = {
    hayStock: false,
    sinStock: false,
    noExiste: false,
   }
   try {
       // Recuperamos los parámetros de la petición
       const tallaElegida = peticion.talla ? peticion.talla.toUpperCase() : null;
       const url = peticion.url ? peticion.url : null;
        
       // Verificar si los parámetros existen
       if (!tallaElegida || !url) {
           return null; 'Faltan parámetros en la petición'
       }
       
       // Configuración de opciones para el navegador Chrome
       const options = new Options().addArguments('--disable-dev-shm-usage', '--no-sandbox');

       // Iniciar el navegador con las opciones configuradas
       const driver = await new Builder()
           .forBrowser('chrome')
           .setChromeOptions(options)
           .build();
           
       try {
           // Cargar la página deseada
           await driver.get(url);
           const ulElement = await driver.findElement(By.css('ul[id*="product-size-selector"]'));
           const liElements = await ulElement.findElements(By.tagName('li'));
           
           // Obtener la clase de la talla para determinar si está disponible
           let tallaEncontrada = false;
           let stockDisponible = false;
           for (let i = 0; i < liElements.length; i++) {
               const li = liElements[i];
               const productSizeInfoMainLabel = await li.findElement(By.xpath('.//*[@data-qa-qualifier="product-size-info-main-label"]'));
               if (!productSizeInfoMainLabel ) {
                   continue;
               }
               
               const productSizeLabelValue = await productSizeInfoMainLabel.getText();
               if (productSizeLabelValue.toUpperCase() === tallaElegida) {
                   tallaEncontrada = true;
                   const dataQAAction = await li.getAttribute('data-qa-action');
                   if (dataQAAction === 'size-low-on-stock' || dataQAAction === 'size-in-stock') {
                       stockDisponible = true;
                   }
                   break;
               }
           }

           if (!tallaEncontrada && !stockDisponible) {
                resultados.noExiste = true; 
           } else if (tallaEncontrada && !stockDisponible){
                resultados.sinStock = true;
           } else {
                resultados.hayStock = true;
           }
           return resultados;

       } catch (e) {
           return null; // Error al cargar la página, devolver null
       } finally {
           if (driver) {
               await driver.quit(); // Cerrar el navegador al finalizar la operación
           }
       }
   } catch (error) {
       return null; // Error inesperado, devolver null
   }
};


/**
* Función para actualizar los registros de peticiones  e enviar un correo al usuario si hay stock
* @param {Object} peticion - Objeto que contiene la información de la petición, incluyendo el ID, talla y URL.
* @returns  - Void.
*/
const enviarActualizarPeticionUsuarios = async (peticionEncontrada,resultadoPeticion) => {
    let is_existe_value = 0;
    let is_stock_value = 0;
    let message = "";

    //Actualizamos campos a procesar en la query y en el update
    if (resultadoPeticion.hayStock) {
        is_existe_value = 1;
        is_stock_value = 1;
        message = "Hay Stock. ";
    } else if (resultadoPeticion.sinStock) {
        is_existe_value = 1;
        is_stock_value = 0;
        message = "No hay Stock. ";
    } else {
        is_existe_value = 0;
        is_stock_value = 0;
        message = "No existe. ";
    }

    //Se buscan los registros a actualizar
    const [consultaPeticiones] = 
        await getJobsByUrlTalla(peticionEncontrada.url, peticionEncontrada.talla,{ is_existe: is_existe_value, is_stock: is_stock_value });

    //Si no hay nada que actualizar no se procesan registros
    if (!consultaPeticiones || consultaPeticiones.length === 0) {
        console.log(`No hay nada que actualziar con la url ${peticionEncontrada.url} y la talla ${peticionEncontrada.talla}`);
        return;
    }
    
    // Iteramos sobre los resultados devueltos por la consulta
    for (let peticion of consultaPeticiones) {
        //Se actualiza el registro y envia un correo electrónico
        await updateExisteStock(peticion.id, { is_existe: is_existe_value, is_stock: is_stock_value });
        console.log(`${message} Se ha actualizado la petición ${peticion.id}`);
    }
};
