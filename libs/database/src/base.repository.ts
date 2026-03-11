import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { IBaseRepository } from './interfaces/base-repository.interface';

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).lean().exec() as Promise<T | null>;
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).lean().exec() as Promise<T | null>;
  }

  async findAll(filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(filter).lean().exec() as Promise<T[]>;
  }

  async create(data: Partial<T>): Promise<T> {
    const doc = new this.model(data);
    return (await doc.save()).toObject() as T;
  }

  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .lean()
      .exec() as Promise<T | null>;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }
}
