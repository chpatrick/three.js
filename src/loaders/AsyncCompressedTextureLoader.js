/**
 * @author mrdoob / http://mrdoob.com/
 * @author nh2 / http://github.com/nh2
 *
 * Abstract Base class to block based textures loader (dds, pvr, ...) with a parsing callback.
 * Useful when parsing is so expensive that it would block the UI thread:
 * With a callback, it can be done in iterations or with Web Workers.
 */

THREE.AsyncCompressedTextureLoader = function ( manager ) {

  this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

  // override in sub classes
  this._asyncParser = null;

};


THREE.AsyncCompressedTextureLoader.prototype = {

  constructor: THREE.CompressedTextureLoader,

  load: function ( url, onLoad, onProgress, onError ) {

    var scope = this;

    var images = [];

    var texture = new THREE.CompressedTexture();
    texture.image = images;

    var loader = new THREE.XHRLoader( this.manager );
    loader.setPath( this.path );
    loader.setResponseType( 'arraybuffer' );

    function loadTexture( i ) {

      loader.load( url[ i ], function ( buffer ) {

        scope._asyncParser( buffer, true, function ( texDatas ) {

          images[ i ] = {
            width: texDatas.width,
            height: texDatas.height,
            format: texDatas.format,
            mipmaps: texDatas.mipmaps
          };

          loaded += 1;

          if ( loaded === 6 ) {

            if ( texDatas.mipmapCount === 1 )
              texture.minFilter = THREE.LinearFilter;

            texture.format = texDatas.format;
            texture.needsUpdate = true;

            if ( onLoad ) onLoad( texture );

          }

        } );

      }, onProgress, onError );

    }

    if ( Array.isArray( url ) ) {

      var loaded = 0;

      for ( var i = 0, il = url.length; i < il; ++ i ) {

        loadTexture( i );

      }

    } else {

      // compressed cubemap texture stored in a single DDS file

      loader.load( url, function ( buffer ) {

        scope._asyncParser( buffer, true, function ( texDatas ) {

          if ( texDatas.isCubemap ) {

            var faces = texDatas.mipmaps.length / texDatas.mipmapCount;

            for ( var f = 0; f < faces; f ++ ) {

              images[ f ] = { mipmaps : [] };

              for ( var i = 0; i < texDatas.mipmapCount; i ++ ) {

                images[ f ].mipmaps.push( texDatas.mipmaps[ f * texDatas.mipmapCount + i ] );
                images[ f ].format = texDatas.format;
                images[ f ].width = texDatas.width;
                images[ f ].height = texDatas.height;

              }

            }

          } else {

            texture.image.width = texDatas.width;
            texture.image.height = texDatas.height;
            texture.mipmaps = texDatas.mipmaps;

          }

          if ( texDatas.mipmapCount === 1 ) {

            texture.minFilter = THREE.LinearFilter;

          }

          texture.format = texDatas.format;
          texture.needsUpdate = true;

          if ( onLoad ) onLoad( texture );

        } );

      }, onProgress, onError );

    }

    return texture;

  },

  setPath: function ( value ) {

    this.path = value;

  }

};
