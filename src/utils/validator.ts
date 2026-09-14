import { Engine } from '../types/engine';

export interface ValidationErrors {
  [field: string]: string;
}

export class EngineValidator {
  /**
   * Valide les données saisies d'un moteur
   */
  public static validate(data: Partial<Engine>): ValidationErrors {
    const errors: ValidationErrors = {};

    // Nom
    if (!data.name || data.name.trim().length === 0) {
      errors.name = 'Le nom du moteur est requis.';
    } else if (data.name.trim().length < 2) {
      errors.name = 'Le nom doit comporter au moins 2 caractères.';
    } else if (data.name.trim().length > 60) {
      errors.name = 'Le nom ne peut pas dépasser 60 caractères.';
    }

    // Constructeur
    if (!data.manufacturer || data.manufacturer.trim().length === 0) {
      errors.manufacturer = 'Le constructeur / marque est requis.';
    }

    // Configuration
    if (!data.configuration) {
      errors.configuration = 'Veuillez sélectionner une architecture de cylindres.';
    }

    // Carburant
    if (!data.fuel) {
      errors.fuel = 'Veuillez sélectionner le type de carburant.';
    }

    // Aspiration
    if (!data.aspiration) {
      errors.aspiration = "Veuillez sélectionner le type d'alimentation.";
    }

    // Puissance (ch)
    if (data.power === undefined || isNaN(data.power)) {
      errors.power = 'La puissance en chevaux (ch) est requise.';
    } else if (data.power <= 0) {
      errors.power = 'La puissance doit être supérieure à 0 ch.';
    } else if (data.power > 5000) {
      errors.power = 'La puissance ne peut pas dépasser 5 000 ch.';
    }

    // Couple (Nm)
    if (data.torque === undefined || isNaN(data.torque)) {
      errors.torque = 'Le couple en Nm est requis.';
    } else if (data.torque <= 0) {
      errors.torque = 'Le couple doit être supérieur à 0 Nm.';
    } else if (data.torque > 6000) {
      errors.torque = 'Le couple ne peut pas dépasser 6 000 Nm.';
    }

    // Régime Max (RPM)
    if (data.maxRpm === undefined || isNaN(data.maxRpm)) {
      errors.maxRpm = 'Le régime moteur max (RPM) est requis.';
    } else if (data.maxRpm < 2000) {
      errors.maxRpm = 'Le régime max doit être au moins de 2 000 tr/min.';
    } else if (data.maxRpm > 25000) {
      errors.maxRpm = 'Le régime max ne peut pas dépasser 25 000 tr/min.';
    }

    // Cylindrée (cm3)
    if (data.configuration !== 'Électrique') {
      if (data.displacement === undefined || isNaN(data.displacement)) {
        errors.displacement = 'La cylindrée en cm³ est requise.';
      } else if (data.displacement < 200) {
        errors.displacement = 'La cylindrée minimale est de 200 cm³.';
      } else if (data.displacement > 20000) {
        errors.displacement = 'La cylindrée ne peut pas dépasser 20 000 cm³.';
      }
    }

    // Année de début
    const currentYear = new Date().getFullYear();
    if (data.yearStart === undefined || isNaN(data.yearStart)) {
      errors.yearStart = "L'année de lancement est requise.";
    } else if (data.yearStart < 1886 || data.yearStart > currentYear + 2) {
      errors.yearStart = `L'année doit être comprise entre 1886 et ${currentYear + 2}.`;
    }

    // Année de fin
    if (data.yearEnd !== null && data.yearEnd !== undefined && !isNaN(data.yearEnd)) {
      if (data.yearStart && data.yearEnd < data.yearStart) {
        errors.yearEnd = "L'année de fin ne peut pas être antérieure à l'année de début.";
      }
    }

    // Description
    if (!data.description || data.description.trim().length === 0) {
      errors.description = 'Une brève description technique est requise.';
    } else if (data.description.trim().length < 10) {
      errors.description = 'La description doit comporter au moins 10 caractères.';
    }

    return errors;
  }
}
