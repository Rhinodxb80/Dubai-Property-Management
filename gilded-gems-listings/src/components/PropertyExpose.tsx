import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer';
import { Property } from '@/data/properties';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#2C3E50',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  priceSection: {
    marginTop: 10,
    marginBottom: 15,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 10,
  },
  mainImage: {
    width: '100%',
    height: 200,
    objectFit: 'cover',
    marginBottom: 10,
  },
  smallImage: {
    width: '48%',
    height: 120,
    objectFit: 'cover',
  },
  table: {
    marginTop: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#2C3E50',
    color: '#FFFFFF',
  },
  tableLabel: {
    width: '40%',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableValue: {
    width: '60%',
    fontSize: 10,
  },
  section: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2C3E50',
  },
  description: {
    fontSize: 10,
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  listItem: {
    fontSize: 9,
    marginBottom: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#7F8C8D',
    borderTop: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 10,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 15,
  },
  column: {
    flex: 1,
  },
});

interface PropertyExposeProps {
  property: Property;
}

const PropertyExpose = ({ property }: PropertyExposeProps) => (
  <Document>
    {/* Page 1 */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{property.name}</Text>
        <Text style={styles.subtitle}>
          {property.neighborhood}{property.subcluster ? ` • ${property.subcluster}` : ''}
        </Text>
      </View>

      <View style={styles.priceSection}>
        <Text style={styles.price}>{property.price}</Text>
        {property.priceDetails && (
          <Text style={{ fontSize: 10, color: '#7F8C8D' }}>{property.priceDetails}</Text>
        )}
      </View>

      <View style={styles.imageGrid}>
        <Image style={styles.mainImage} src={property.image} />
        {property.developmentImages && property.developmentImages.slice(0, 2).map((img, idx) => (
          <Image key={idx} style={styles.smallImage} src={img.url} />
        ))}
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableLabel, { color: '#FFFFFF' }]}>Property Details</Text>
          <Text style={[styles.tableValue, { color: '#FFFFFF' }]}></Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Bedrooms</Text>
          <Text style={styles.tableValue}>{property.bedrooms}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Bathrooms</Text>
          <Text style={styles.tableValue}>{property.bathrooms}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Size</Text>
          <Text style={styles.tableValue}>{property.sqft.toLocaleString()} sqft</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Type</Text>
          <Text style={styles.tableValue}>{property.labels.join(', ')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{property.description}</Text>
      </View>

      <View style={styles.footer}>
        <Text>For more information, please contact us</Text>
      </View>
    </Page>

    {/* Page 2 */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{property.name}</Text>
        <Text style={styles.subtitle}>Property Features & Amenities</Text>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>Features</Text>
          {property.features.map((feature, idx) => (
            <Text key={idx} style={styles.listItem}>• {feature}</Text>
          ))}
        </View>

        <View style={styles.column}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          {property.amenities.map((amenity, idx) => (
            <Text key={idx} style={styles.listItem}>• {amenity}</Text>
          ))}
        </View>
      </View>

      {property.locationDescription && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.description}>{property.locationDescription}</Text>
        </View>
      )}

      {property.floorplans && property.floorplans.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Floor Plans</Text>
          {property.floorplans.map((plan, index) => (
            <View key={`${plan.url}-${index}`} style={{ marginTop: 10 }}>
              <Image
                style={{ width: "100%", height: 200, objectFit: "contain" }}
                src={plan.url}
              />
              {plan.title && (
                <Text style={{ fontSize: 10, fontWeight: 600, marginTop: 4, color: "#2C3E50" }}>
                  {plan.title}
                </Text>
              )}
              {plan.description && (
                <Text style={{ fontSize: 9, marginTop: 2, color: "#7F8C8D" }}>
                  {plan.description}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text>This property exposé is for informational purposes only</Text>
      </View>
    </Page>
  </Document>
);

export const generatePropertyExpose = async (property: Property) => {
  const blob = await pdf(<PropertyExpose property={property} />).toBlob();
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = `${property.name.replace(/\s+/g, '_')}_Expose.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
};
