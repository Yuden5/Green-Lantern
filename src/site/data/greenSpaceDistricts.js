import districtGardenData from '../../prompt/15_min_greenspaces.md?raw';

function parseDistrictGardenData(source) {
  const [header, ...rows] = source.trim().split(/\r?\n/);

  if (header?.trim() !== 'District,Number of 15-Minute Gardens') {
    throw new Error('Unexpected district garden data format.');
  }

  const districts = rows.map((row) => {
    const separator = row.lastIndexOf(',');
    const name = row.slice(0, separator).trim();
    const gardens = Number(row.slice(separator + 1).trim());

    if (separator < 1 || !name || !Number.isInteger(gardens) || gardens < 1) {
      throw new Error(`Invalid district garden data row: "${row}".`);
    }

    return { name, gardens };
  });

  if (new Set(districts.map(({ name }) => name)).size !== districts.length) {
    throw new Error('District garden data contains duplicate district names.');
  }

  return districts;
}

export const greenSpaceDistricts = parseDistrictGardenData(districtGardenData);
export const totalDistrictGardens = greenSpaceDistricts.reduce(
  (total, { gardens }) => total + gardens,
  0,
);
