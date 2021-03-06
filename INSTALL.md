# Instalación

## Prerrequisitos

La instalación y configuración se la realizó sobre el Sistema Operativo Debian Wheezy.

Creación de usuario de sistema operativo para realizar el despliegue:

```
$ sudo adduser geoelectoral
$ sudo su - geoelectoral
```

Instalación de dependencias:

```
$ sudo apt-get install postgresql-9.1 git gcc make libxml2-dev libxslt-dev g++ libpq-dev apache2 libapache2-mod-proxy-html
```

Instalar Node.js:

```
$ sudo apt-get install curl
$ curl -sL https://deb.nodesource.com/setup | bash -
$ sudo apt-get install nodejs nodejs-legacy
```

Instalar Yeoman: Yeoman ayuda al inicio rápido de nuevos proyectos, la prescripción de las
mejores prácticas y herramientas para ayudar a mantener su productividad

```
$ npm install -g yo
```

Instalar Bower: Bower es un manejador de paquetes para la Web, maneja frameworks,
librerías, CSS, JavaScript, y utilidades, para optimizar el desarrollo frontend.

```
$ npm install -g bower
```

Clonar el repositorio:

```
$ sudo su - geoelectoral
$ cd ~
$ git clone https://gitlab.geo.gob.bo/adsib/geoelectoral-portal.git
$ cd geoelectoral-portal
```

## Configuración

Existe un archivo de configuración llamado `config.json` en la raíz del proyecto con el siguiente contenido:

```json
{
  "development": {
    "name": "development",
    "geoelectoralApi": "//localhost:3000",
    "geoelectoralApiVersion": "/api/v1",
    "porcentajeMin": 3,
    "color": "bbb"
  },
  "production": {
    "name": "production",
    "geoelectoralApi": "//sitio-de-prueba.com.bo/geoelectoral-api",
    "geoelectoralApiVersion": "/api/v1",
    "porcentajeMin": 3,
    "color": "bbb"
  }
}
```

Se debe configurar la parte de `"production"`, establecer la URL de GeoElectoral API en la entrada `"geoelectoralApi"` si se encuentra en una ubicación diferente a `//sitio-de-prueba.com.bo/geoelectoral-api`.

## Instalación

Para instalar el Frontend ejecutar los siguientes comandos:

```
$ npm install
$ bower install
$ grunt build --force
```

El último comando creará una carpeta dentro del proyecto llamado `dist`. Ésta carpeta contiene
los archivos optimizados para web, hojas de estilo y JavaScript comprimidos y minificados.

**Problemas relacionados con `wiredep`**

```
Running "wiredep:app" (wiredep) task
Warning: ENOENT, no such file or directory 'geoelectoral-portal/app/bower.json' Use --force to continue.
```
La librería `grunt-wiredep` actualmente se instala con la versión `1.9.0`, probar con el comando `npm list | grep wiredep`:

```
├─┬ grunt-wiredep@1.9.0
│ └─┬ wiredep@1.8.5
```

La versión que se necesita es la `1.8.0` para evitar el Warning, para ello se ejecuta:

```
$ npm uninstall grunt-wiredep@1.9.0
$ npm install grunt-wiredep@1.8.0
```

```
$ npm list | grep wiredep
├─┬ grunt-wiredep@1.8.0
│ └─┬ wiredep@1.8.5
```

Con esto ya debería funcionar normalmente el comando `grunt build` sin la opción `--force`.

## Apache

Mover la aplicación al directorio `/var/www`:

```
$ cd ~
$ sudo mv geoelectoral-portal /var/www
```

Configuración del Frontend con Apache2 en una Virtual Host:

```
$ cd /etc/apache2/sites-available
$ sudo nano default
```

Adicionamos el siguiente contenido en el archivo:

```apache
<VirtualHost *:80>
  ServerName sitio-de-prueba.com.bo
  # SSL Engine Switch:
  # Enable/Disable SSL for this virtual host.
  # SSLEngine on
  # SSLCertificateFile /etc/ssl/certs/sitio-de-prueba.com.bo.crt
  # SSLCertificateKeyFile /etc/ssl/private/sitio-de-prueba.com.bo.key
  <IfModule mod_rewrite.c>
    RewriteEngine off
    RewriteRule ^/geoelectoral$ /geoelectoral/ [R]
    RewriteCond %{SERVER_PORT} !^443$
    RewriteCond %{REQUEST_URI} ^/geoelectoral/
    RewriteRule ^/(.*) http://%{SERVER_NAME}/$1 [L,R,NE]
  </IfModule>
  DocumentRoot /var/www/geoelectoral-portal/dist
  Alias /geoelectoral /var/www/geoelectoral-portal/dist
  <Directory /var/www/geoelectoral-portal/dist>
    # enable the .htaccess rewrites
    AllowOverride All
    Order allow,deny
    Allow from All
  </Directory>
  CustomLog /var/log/apache2/default/access.log combined
  ErrorLog /var/log/apache2/default/error.log
</VirtualHost>
```

Después de finalizar la configuración actualizamos Apache2:

```
$ sudo /etc/init.d/apache2 graceful
```

Con esto debería estar configurado la aplicación en:

```
http://sitio-de-prueba.com.bo/geoelectoral
```