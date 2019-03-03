import { MetadataProvider } from './MetadataProvider';
import { Cascade, EntityMetadata, EntityProperty, ReferenceType } from '../decorators/Entity';
import { Utils } from '../utils/Utils';

export class JavaScriptMetadataProvider extends MetadataProvider {

  discoverEntity(meta: EntityMetadata, name: string): void {
    const { schema } = require(meta.path);
    Object.entries(schema.properties).forEach(([name, prop]) => {
      if (typeof prop === 'string') {
        schema.properties[name] = { type: prop };
      }
    });

    Utils.merge(meta, schema);
    Object.entries(meta.properties).forEach(([name, prop]) => {
      this.initProperty(prop, name);
    });
  }

  /**
   * Re-hydrates missing attributes like `onUpdate` (functions are lost when caching to JSON)
   */
  loadFromCache(meta: EntityMetadata, cache: EntityMetadata): void {
    Utils.merge(meta, cache);
    const { schema } = require(meta.path);

    Object.entries(schema.properties).forEach(([name, prop]) => {
      if (Utils.isObject(prop)) {
        Object.entries(prop).forEach(([attribute, value]) => {
          if (!(attribute in meta.properties[name])) {
            meta.properties[name][attribute as keyof EntityProperty] = value;
          }
        });
      }
    });
  }

  private initProperty(prop: EntityProperty, propName: string): void {
    prop.name = propName;

    if (typeof prop.reference === 'undefined') {
      prop.reference = ReferenceType.SCALAR;
    }

    if (prop.reference !== ReferenceType.SCALAR && typeof prop.cascade === 'undefined') {
      prop.cascade = [Cascade.PERSIST];
    }
  }

}