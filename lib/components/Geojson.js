import React from 'react';
import MapView from './MapView';

export const makeOverlays = geojson => {
  if (geojson.features) {
    return makeFeatureOverlays(geojson.features);
  }

  if (geojson.type === 'GeometryCollection' && geojson.geometries) {
    return makeGeometryOverlays(geojson.geometries);
  }
}

export const makeFeatureOverlays = features => {
  const points = features
    .filter(
      f =>
        f.geometry &&
        (f.geometry.type === 'Point' || f.geometry.type === 'MultiPoint')
    )
    .map(feature => {
      const { geometry } = feature
      makeCoordinates(geometry).map(coordinates =>
        makeOverlay(coordinates, geometry)
      )
    })
    .reduce(flatten, [])
    .map(overlay => ({ ...overlay, type: 'point' }));

  const lines = features
    .filter(
      f =>
        f.geometry &&
        (f.geometry.type === 'LineString' ||
          f.geometry.type === 'MultiLineString')
    )
    .map(feature => {
      const { geometry } = feature
      makeCoordinates(geometry).map(coordinates =>
        makeOverlay(coordinates, geometry)
      )
    })
    .reduce(flatten, [])
    .map(overlay => ({ ...overlay, type: 'polyline' }));

  const multipolygons = features
    .filter(f => f.geometry && f.geometry.type === 'MultiPolygon')
    .map(feature => {
      const { geometry } = feature
      makeCoordinates(geometry).map(coordinates =>
        makeOverlay(coordinates, geometry)
      )
    })
    .reduce(flatten, []);

  const polygons = features
    .filter(f => f.geometry && f.geometry.type === 'Polygon')
    .map(feature => {
      const { geometry } = feature
      makeOverlay(makeCoordinates(geometry), geometry)
    })
    .reduce(flatten, [])
    .concat(multipolygons)
    .map(overlay => ({ ...overlay, type: 'polygon' }));

  return points.concat(lines).concat(polygons);
};



export const makeGeometryOverlays = geometries => {
  const points = geometries
    .filter(g => g.type === 'Point' || g.type === 'MultiPoint')
    .map(geometry =>
      makeCoordinates(geometry).map(coordinates =>
        makeOverlay(coordinates, geometry)
      )
    )
    .reduce(flatten, [])
    .map(overlay => ({ ...overlay, type: 'point' }));

  const lines = geometries
    .filter(g => g.type === 'LineString' || g.type === 'MultiLineString')
    .map(geometry =>
      makeCoordinates(geometry).map(coordinates =>
        makeOverlay(coordinates, geometry)
      )
    )
    .reduce(flatten, [])
    .map(overlay => ({ ...overlay, type: 'polyline' }));

  const multipolygons = geometries
    .filter(g => g.type === 'MultiPolygon')
    .map(geometry =>
      makeCoordinates(geometry).map(coordinates =>
        makeOverlay(coordinates, geometry)
      )
    )
    .reduce(flatten, []);

  const polygons = geometries
    .filter(g => g.type === 'Polygon')
    .map(geometry => makeOverlay(makeCoordinates(geometry), geometry))
    .reduce(flatten, [])
    .concat(multipolygons)
    .map(overlay => ({ ...overlay, type: 'polygon' }));

  return points.concat(lines).concat(polygons);
}

const flatten = (prev, curr) => prev.concat(curr);

const makeOverlay = (coordinates, feature) => {
  let overlay = {
    feature,
  };
  if (
    feature.type === 'Polygon' ||
    feature.type === 'MultiPolygon'
  ) {
    overlay.coordinates = coordinates[0];
    if (coordinates.length > 1) {
      overlay.holes = coordinates.slice(1);
    }
  } else {
    overlay.coordinates = coordinates;
  }
  return overlay;
};

const makePoint = c => ({ latitude: c[1], longitude: c[0] });

const makeLine = l => l.map(makePoint);

const makeCoordinates = feature => {
  const { coordinates, type } = feature

  if (type === 'Point') {
    return [makePoint(coordinates)];
  } else if (type === 'MultiPoint') {
    return coordinates.map(makePoint);
  } else if (type === 'LineString') {
    return [makeLine(coordinates)];
  } else if (type === 'MultiLineString') {
    return coordinates.map(makeLine);
  } else if (type === 'Polygon') {
    return coordinates.map(makeLine);
  } else if (type === 'MultiPolygon') {
    return coordinates.map(p => p.map(makeLine));
  } else {
    return [];
  }
};

const Geojson = props => {
  const overlays = makeOverlays(props.geojson);

  return (
    <React.Fragment>
      {overlays.map((overlay, index) => {
        if (overlay.type === 'point') {
          return (
            <MapView.Marker
              key={index}
              coordinate={overlay.coordinates}
              pinColor={props.color}
            />
          );
        }
        if (overlay.type === 'polygon') {
          return (
            <MapView.Polygon
              key={index}
              coordinates={overlay.coordinates}
              holes={overlay.holes}
              strokeColor={props.strokeColor}
              fillColor={props.fillColor}
              strokeWidth={props.strokeWidth}
            />
          );
        }
        if (overlay.type === 'polyline') {
          return (
            <MapView.Polyline
              key={index}
              coordinates={overlay.coordinates}
              strokeColor={props.strokeColor}
              strokeWidth={props.strokeWidth}
            />
          );
        }
      })}
    </React.Fragment>
  );
};

export default Geojson;
