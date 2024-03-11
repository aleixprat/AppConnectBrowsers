const cron = require('node-cron');
const { getJobs,getJobsByUrlTalla } = require('../models/peticiones.model');

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
        // Realizar la petición a la URL almacenada en la base de datos y verificar si hay cambios
        const [peticiones] = await getJobs();

        
        if (!peticiones || peticiones.length == 0) {
            console.log('No hay peticiones actualmente');
            return;
        }
        
        //Depurar a partir de aqui
        // Si hay peticiones, iterar sobre ellas y ejecutar ajaxHola() para cada una
        const arrayEncontrados = [];
        for (let peticion of peticiones) {
            const resultadoPeticion=  await verificarDisponibilidad(peticion); //Devolvera un null si no encuentra nada
            if (resultadoPeticion) {
                arrayEncontrados.push(resultadoPeticion);
            }
            
        }
        //Recorremos los que se han encontrado
        if (arrayEncontrados.length > 0) {
            for (let peticionEncontrada of arrayEncontrados) {
                enviarCorreoElectronicoSiHayCambios(peticionEncontrada);
                //Insert modificando a encontrado
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

           if (!tallaEncontrada || !stockDisponible) {
               return null; // La talla no está disponible, devolver null
           }

           // Construir el objeto de respuesta
           const mensaje = 'La talla está disponible';
           return peticion;
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



const enviarCorreoElectronicoSiHayCambios = async (peticionEncontrada) => {
    // Implementa la lógica para enviar un correo electrónico si hay cambios
    // Puedes utilizar nodemailer u otra biblioteca para enviar correos electrónicos
    const [peticiones] = await getJobsByUrlTalla(peticionEncontrada.url,peticionEncontrada.talla);
    console.log(`Peticiones Encontradas con la url: ${peticionEncontrada.url} y la talla ${peticionEncontrada.talla}.`);
    if (!peticiones) {
        return;
    }
    console.log(`Array con las peticiones de las distintas personas ${peticiones}`);
};
