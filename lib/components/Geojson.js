import React from 'react';
import MapView from './MapView';

export const makeOverlays = geojson => {
  console.error(geojson)

  if (geojson.type === 'GeometryCollection' && geojson.geometries) {
    console.error("geometries ...")

    return makeGeometryOverlays(geojson.geometries)
  }

  if (geojson.features) {
    console.error("features ...")

    return makeFeatureOverlays(geojson.features)
  }
}

export const makeFeatureOverlays = features => {
  console.error("makeFeatureOverlays()")

  const points = features
    .filter(
      f =>
        f.geometry &&
        (f.geometry.type === 'Point' || f.geometry.type === 'MultiPoint')
    )
    .map(feature =>
      makeCoordinates(feature).map(coordinates =>
        makeOverlay(coordinates, feature)
      )
    )
    .reduce(flatten, [])
    .map(overlay => ({ ...overlay, type: 'point' }));

  const lines = features
    .filter(
      f =>
        f.geometry &&
        (f.geometry.type === 'LineString' ||
          f.geometry.type === 'MultiLineString')
    )
    .map(feature =>
      makeCoordinates(feature).map(coordinates =>
        makeOverlay(coordinates, feature)
      )
    )
    .reduce(flatten, [])
    .map(overlay => ({ ...overlay, type: 'polyline' }));

  const multipolygons = features
    .filter(f => f.geometry && f.geometry.type === 'MultiPolygon')
    .map(feature =>
      makeCoordinates(feature).map(coordinates =>
        makeOverlay(coordinates, feature)
      )
    )
    .reduce(flatten, []);

  const polygons = features
    .filter(f => f.geometry && f.geometry.type === 'Polygon')
    .map(feature => makeOverlay(makeCoordinates(feature), feature))
    .reduce(flatten, [])
    .concat(multipolygons)
    .map(overlay => ({ ...overlay, type: 'polygon' }));

  console.error({ points, lines, multipolygons, polygons })

  return points.concat(lines).concat(polygons);
};

export const makeGeometryOverlays = geometries => {
  console.error("makeGeometryOverlays()")

  const points = geometries
    .filter(g => {
      console.log("[point]g:", g)
      return g.type === 'Point' || g.type === 'MultiPoint'
    })
    .map(geometry =>
      makeCoordinates(geometry).map(coordinates =>
        makeOverlay(coordinates, geometry)
      )
    )
    .reduce(flatten, [])
    .map(overlay => ({ ...overlay, type: 'point' }));

  const lines = geometries
    .filter(g => {
      console.log("[line]g:", g)
      return g.type === 'LineString' || g.type === 'MultiLineString'
    })
    .map(geometry =>
      makeCoordinates(geometry).map(coordinates =>
        makeOverlay(coordinates, geometry)
      )
    )
    .reduce(flatten, [])
    .map(overlay => ({ ...overlay, type: 'polyline' }));

  const multipolygons = geometries
    .filter(g => {
      console.log("[mp]g:", g)
      return g.type === 'MultiPolygon'
    })
    .map(geometry =>
      makeCoordinates(geometry).map(coordinates =>
        makeOverlay(coordinates, geometry)
      )
    )
    .reduce(flatten, []);

  const polygons = geometries
    .filter(g => {
      console.log("[poly]g:", g)
      return g.type === 'Polygon'
    })
    .map(geometry => makeOverlay(makeCoordinates(geometry), geometry))
    .reduce(flatten, [])
    .concat(multipolygons)
    .map(overlay => ({ ...overlay, type: 'polygon' }));

  console.error({ points, lines, multipolygons, polygons })

  return points.concat(lines).concat(polygons);
}

const flatten = (prev, curr) => prev.concat(curr);

const makeOverlay = (coordinates, feature) => {
  let overlay = {
    feature,
  };
  if (
    feature.geometry.type === 'Polygon' ||
    feature.geometry.type === 'MultiPolygon'
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
  const g = feature.geometry;
  if (g.type === 'Point') {
    return [makePoint(g.coordinates)];
  } else if (g.type === 'MultiPoint') {
    return g.coordinates.map(makePoint);
  } else if (g.type === 'LineString') {
    return [makeLine(g.coordinates)];
  } else if (g.type === 'MultiLineString') {
    return g.coordinates.map(makeLine);
  } else if (g.type === 'Polygon') {
    return g.coordinates.map(makeLine);
  } else if (g.type === 'MultiPolygon') {
    return g.coordinates.map(p => p.map(makeLine));
  } else {
    return [];
  }
};

const Geojson = props => {
  const overlays = makeOverlays(props.geojson/*.features*/);

  console.error(overlays)

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
